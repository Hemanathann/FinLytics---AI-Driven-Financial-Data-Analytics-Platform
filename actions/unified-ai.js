"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

// ── Groq API helper ────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL   = "llama-3.3-70b-versatile";

async function callGroq(messages, maxTokens = 2048) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set in .env.local");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      max_tokens:  maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" }, // enforce JSON output
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Rule-based fallbacks (no API needed) ──────────────────────
function buildRuleInsights(data) {
  const { totalIncome, totalExpense, topCategory, momChange,
          recurringTotal, budget, byCategory, avgMonthly } = data;
  const insights = [];
  const savingsRate = totalIncome > 0
    ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  if (topCategory) {
    const pct = ((topCategory[1] / totalExpense) * 100).toFixed(0);
    insights.push({ text: `Your top spending category is ${topCategory[0]} at €${topCategory[1].toFixed(0)} (${pct}% of expenses).`, severity: pct > 40 ? "warning" : "info", icon: "pie" });
  }
  if (momChange > 10) insights.push({ text: `Spending increased ${momChange.toFixed(0)}% vs last month — review recent purchases.`, severity: "warning", icon: "trend" });
  if (momChange < -10) insights.push({ text: `Great job! Spending dropped ${Math.abs(momChange).toFixed(0)}% vs last month.`, severity: "success", icon: "check" });
  if (savingsRate >= 20) insights.push({ text: `Strong savings rate of ${savingsRate}% — you're building wealth effectively.`, severity: "success", icon: "savings" });
  if (savingsRate < 10 && savingsRate >= 0) insights.push({ text: `Savings rate is only ${savingsRate}% — aim for 20% by reducing discretionary spend.`, severity: "warning", icon: "savings" });
  if (recurringTotal > avgMonthly * 0.3) insights.push({ text: `Subscriptions use ${((recurringTotal/avgMonthly)*100).toFixed(0)}% of monthly spend (€${recurringTotal.toFixed(0)}) — audit unused services.`, severity: "warning", icon: "recurring" });
  if (budget && totalExpense > budget * 0.9) insights.push({ text: `You've used ${((totalExpense/budget)*100).toFixed(0)}% of your monthly budget. Watch spending this month.`, severity: "warning", icon: "budget" });

  return insights;
}

function buildRuleSuggestions(byCategory, avgMonthly) {
  const suggestions = [];
  Object.entries(byCategory).forEach(([cat, total]) => {
    const monthly = total / 2;
    const pct = (monthly / avgMonthly) * 100;
    if (cat === "food" && pct > 15) suggestions.push({ category: "food", suggestion: `Reducing dining out by 20% could save €${(monthly * 0.2).toFixed(2)}/month`, saving: parseFloat((monthly * 0.2).toFixed(2)), icon: "🍔", type: "reduce" });
    if (cat === "entertainment" && monthly > 50) suggestions.push({ category: "entertainment", suggestion: `Trimming entertainment by 30% saves €${(monthly * 0.3).toFixed(0)}/month`, saving: parseFloat((monthly * 0.3).toFixed(2)), icon: "🎬", type: "reduce" });
    if (cat === "shopping" && monthly > 150) suggestions.push({ category: "shopping", suggestion: `Cutting impulse shopping by 25% saves €${(monthly * 0.25).toFixed(0)}/month`, saving: parseFloat((monthly * 0.25).toFixed(2)), icon: "🛍️", type: "reduce" });
    if (cat === "transportation" && monthly > 100) suggestions.push({ category: "transportation", suggestion: `Optimising transport could save €${(monthly * 0.15).toFixed(0)}/month`, saving: parseFloat((monthly * 0.15).toFixed(2)), icon: "🚗", type: "optimise" });
    if (cat === "currency-exchange" && monthly > 50) suggestions.push({ category: "currency-exchange", suggestion: `Use Wise or Revolut instead of bank forex — could save €${(monthly * 0.4).toFixed(0)}/month in fees`, saving: parseFloat((monthly * 0.4).toFixed(2)), icon: "💱", type: "switch" });
  });
  return suggestions.slice(0, 4);
}

function buildRuleBudget(byCategory, avgMonthlyIncome, totalExpense) {
  const needsCats = ["housing","utilities","groceries","transportation","healthcare","insurance","bills"];
  return Object.entries(byCategory)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 8)
    .map(([category, avgSpend]) => {
      const isNeed = needsCats.includes(category);
      const recommended = !isNeed && avgSpend > avgMonthlyIncome * 0.08
        ? avgMonthlyIncome * 0.08 : avgSpend;
      const status = avgSpend > recommended * 1.1 ? "over"
        : avgSpend < recommended * 0.85 ? "under" : "optimal";
      return { category, current: parseFloat(avgSpend.toFixed(2)), recommended: parseFloat(recommended.toFixed(2)), pct: parseFloat((avgSpend / avgMonthlyIncome * 100).toFixed(1)), type: isNeed ? "need" : "want", status };
    });
}

// ── Single unified AI call via Groq ───────────────────────────
async function callGroqOnce(financialSummary) {
  const systemMsg = `You are a personal finance advisor. Return ONLY valid JSON, no markdown, no explanation.`;

  const userMsg = `Financial data for analysis:
- Monthly income: €${financialSummary.avgMonthlyIncome.toFixed(0)}
- Monthly expenses: €${financialSummary.avgMonthly.toFixed(0)}
- Savings rate: ${financialSummary.savingsRate}%
- Top category: ${financialSummary.topCategory?.[0] || "N/A"} (€${financialSummary.topCategory?.[1]?.toFixed(0) || 0}/mo)
- Subscriptions: €${financialSummary.recurringTotal.toFixed(0)}/mo
- Month-over-month change: ${financialSummary.momChange.toFixed(0)}%
- Spending by category: ${Object.entries(financialSummary.byCategory).map(([k,v]) => `${k}: €${(v/2).toFixed(0)}/mo`).join(", ")}

Return this exact JSON structure:
{
  "narrative": "2-3 sentence personalised insight using the specific numbers above. Use second person. Be specific and actionable.",
  "aiSuggestions": [
    {"suggestion": "specific tip with euro amount based on their data", "saving": 45.00, "icon": "💡", "category": "general"},
    {"suggestion": "second tip", "saving": 30.00, "icon": "🛒", "category": "groceries"},
    {"suggestion": "third tip", "saving": 20.00, "icon": "💳", "category": "bills"}
  ],
  "budgetNarrative": "1-2 sentence budget recommendation referencing their actual income and biggest overspend."
}`;

  const text = await callGroq([
    { role: "system", content: systemMsg },
    { role: "user",   content: userMsg },
  ], 1024);

  // Parse JSON — strip markdown fences if present
  const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}

// ── Main export ────────────────────────────────────────────────
export async function getAllAIInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { budgets: true },
  });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const threeMonthsAgo = startOfMonth(subMonths(now, 2));
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const thisMonthStart = startOfMonth(now);

  const txns = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: threeMonthsAgo },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
    },
    orderBy: { date: "asc" },
  });

  if (txns.length < 3) {
    const empty = { insights: [], narrative: "Add more transactions to unlock AI insights.", suggestions: [], totalPotentialSavings: 0, recommendations: [], avgMonthlyIncome: 0, savingsTarget: 0, narrative2: "" };
    return empty;
  }

  const serialized = txns.map((t) => ({ ...t, amount: Number(t.amount) }));
  const budget = user.budgets[0];
  const budgetAmount = budget ? Number(budget.amount) : null;

  // ── Compute all stats ──────────────────────────────────────
  const totalIncome  = serialized.filter(t => t.type === "INCOME").reduce((s,t) => s+t.amount, 0);
  const totalExpense = serialized.filter(t => t.type === "EXPENSE").reduce((s,t) => s+t.amount, 0);
  const avgMonthlyIncome = totalIncome / 3;
  const avgMonthly = totalExpense / 3;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  const byCategory = {};
  serialized.filter(t => t.type === "EXPENSE").forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const topCategory = Object.entries(byCategory).sort(([,a],[,b]) => b-a)[0] || null;
  const recurringTotal = serialized.filter(t => t.isRecurring && t.type === "EXPENSE").reduce((s,t) => s+t.amount, 0) / 3;

  const thisMonthExpense = serialized.filter(t => t.type === "EXPENSE" && new Date(t.date) >= thisMonthStart).reduce((s,t) => s+t.amount, 0);
  const lastMonthExpense = serialized.filter(t => t.type === "EXPENSE" && new Date(t.date) >= lastMonthStart && new Date(t.date) < thisMonthStart).reduce((s,t) => s+t.amount, 0);
  const momChange = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;

  const financialSummary = { totalIncome, totalExpense, avgMonthlyIncome, avgMonthly, savingsRate, byCategory, topCategory, recurringTotal, momChange, budget: budgetAmount };

  // ── Rule-based (always works, no API) ─────────────────────
  const ruleInsights     = buildRuleInsights(financialSummary);
  const ruleSuggestions  = buildRuleSuggestions(byCategory, avgMonthly);
  const ruleRecommendations = buildRuleBudget(byCategory, avgMonthlyIncome, totalExpense);
  const savingsTarget    = avgMonthlyIncome * 0.20;

  // ── Single Groq call (may fail gracefully) ─────────────────
  let narrative     = `Your spending over the last 3 months shows €${totalExpense.toFixed(0)} in expenses against €${totalIncome.toFixed(0)} in income — a savings rate of ${savingsRate}%.`;
  let aiSuggestions = [];
  let budgetNarrative = avgMonthlyIncome > 0 ? `Based on your €${avgMonthlyIncome.toFixed(0)} monthly income, targeting 20% savings means keeping expenses under €${(avgMonthlyIncome * 0.8).toFixed(0)}/month.` : "";

  try {
    const aiResult = await callGroqOnce(financialSummary);
    if (aiResult.narrative)       narrative       = aiResult.narrative;
    if (aiResult.aiSuggestions)   aiSuggestions   = aiResult.aiSuggestions.slice(0, 3);
    if (aiResult.budgetNarrative) budgetNarrative = aiResult.budgetNarrative;
  } catch (err) {
    console.warn("Groq unavailable, using rule-based insights:", err.message);
    // Silently fall back — rule-based data already set above
  }

  const allSuggestions = [...ruleSuggestions, ...aiSuggestions].slice(0, 6);
  const totalPotentialSavings = allSuggestions.reduce((s, sg) => s + (sg.saving || 0), 0);

  return {
    // For AIInsightsCard
    insights:  ruleInsights,
    narrative,

    // For AISavingSuggestionsCard
    suggestions: allSuggestions,
    totalPotentialSavings: parseFloat(totalPotentialSavings.toFixed(2)),
    avgMonthlyExpense: parseFloat(avgMonthly.toFixed(2)),

    // For SmartBudgetCard
    recommendations: ruleRecommendations,
    avgMonthlyIncome: parseFloat(avgMonthlyIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    savingsTarget: parseFloat(savingsTarget.toFixed(2)),
    narrative: budgetNarrative || narrative,
    hasBudget: !!budgetAmount,
    rule: "50/30/20",

    // Pass through both narratives
    insightNarrative: narrative,
    budgetNarrative,
  };
}