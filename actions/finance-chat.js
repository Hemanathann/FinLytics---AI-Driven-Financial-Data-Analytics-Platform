"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subMonths, startOfMonth, format } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rule-based fallback answers — works even when Gemini is rate-limited
function ruleBased(message, data) {
  const msg = message.toLowerCase();
  const { totalIncome, totalExpense, topCat, catMap, budget, txnCount, savingsRate } = data;
  const net = totalIncome - totalExpense;

  if (msg.includes("overspend") || msg.includes("biggest expense") || msg.includes("top category")) {
    if (!topCat) return "No expense data available yet. Import a bank statement to get insights.";
    const pct = totalExpense > 0 ? ((catMap[topCat] / totalExpense) * 100).toFixed(0) : 0;
    return `Your biggest expense category is **${topCat}** at $${catMap[topCat].toFixed(2)} (${pct}% of total expenses over the last 3 months).\n\nTop 3 categories:\n${Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,3).map(([c,a],i)=>`${i+1}. ${c}: $${a.toFixed(2)}`).join("\n")}`;
  }
  if (msg.includes("savings rate") || msg.includes("saving rate")) {
    return `Your savings rate over the last 3 months is **${savingsRate}%**.\n\n• Total income: $${totalIncome.toFixed(2)}\n• Total expenses: $${totalExpense.toFixed(2)}\n• Net saved: $${net.toFixed(2)}\n\n${savingsRate >= 20 ? "Great job — you're above the recommended 20% savings rate." : "Aim for at least 20% savings rate. Try reducing your top spending categories."}`;
  }
  if (msg.includes("summarise") || msg.includes("summary") || msg.includes("overview")) {
    return `**Financial summary — last 3 months:**\n\n• Total income: $${totalIncome.toFixed(2)}\n• Total expenses: $${totalExpense.toFixed(2)}\n• Net savings: $${net.toFixed(2)}\n• Savings rate: ${savingsRate}%\n• Transactions: ${txnCount}\n• Top spending: ${topCat || "N/A"}${budget ? `\n• Monthly budget: $${budget}` : ""}`;
  }
  if (msg.includes("budget")) {
    if (!budget) return "You haven't set a monthly budget yet. Go to the dashboard and set one to track your spending against a target.";
    const monthlyAvg = totalExpense / 3;
    const diff = budget - monthlyAvg;
    return `Your monthly budget is **$${budget}**.\n\n• Average monthly spend: $${monthlyAvg.toFixed(2)}\n• ${diff >= 0 ? `Under budget by $${diff.toFixed(2)}/month ✅` : `Over budget by $${Math.abs(diff).toFixed(2)}/month ⚠️`}`;
  }
  if (msg.includes("save more") || msg.includes("cut") || msg.includes("reduce")) {
    const sorted = Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,3);
    return `To save more money, focus on your top spending categories:\n\n${sorted.map(([c,a],i)=>`${i+1}. **${c}**: $${a.toFixed(2)} over 3 months ($${(a/3).toFixed(2)}/month)`).join("\n")}\n\nEven cutting 10-15% from each could save $${(sorted.reduce((s,[,a])=>s+a,0)*0.12/3).toFixed(0)}/month.`;
  }
  if (msg.includes("forecast") || msg.includes("next month") || msg.includes("predict")) {
    const monthlyAvg = totalExpense / 3;
    return `Based on your last 3 months average, I forecast you'll spend around **$${monthlyAvg.toFixed(2)}** next month.\n\n• Current monthly average: $${monthlyAvg.toFixed(2)}\n• If you reduce by 10%: $${(monthlyAvg * 0.9).toFixed(2)}\n• If you reduce by 20%: $${(monthlyAvg * 0.8).toFixed(2)}`;
  }
  return null; // No rule matched — let Gemini handle it
}

export async function chatWithFinanceAI(message, history = []) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Please sign in to use the AI advisor.");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { budgets: true },
    });
    if (!user) throw new Error("User not found.");

    const threeMonthsAgo = startOfMonth(subMonths(new Date(), 3));
    const transactions = await db.transaction.findMany({
      where: { userId: user.id, date: { gte: threeMonthsAgo } },
      orderBy: { date: "desc" },
      take: 200,
    });

    if (transactions.length === 0) {
      return "I don't see any transactions yet. Import a bank statement first and I'll be able to give you personalised insights about your spending!";
    }

    const serialized = transactions.map(t => ({
      date:        format(new Date(t.date), "yyyy-MM-dd"),
      type:        t.type,
      amount:      Number(t.amount),
      category:    t.category,
      description: t.description || "",
    }));

    const totalIncome  = serialized.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const totalExpense = serialized.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    const savingsRate  = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;
    const budget       = user.budgets[0] ? Number(user.budgets[0].amount) : null;

    const catMap = {};
    serialized.filter(t => t.type === "EXPENSE").forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort(([,a],[,b])=>b-a)[0]?.[0] || null;
    const topCats = Object.entries(catMap).sort(([,a],[,b])=>b-a).slice(0,6)
      .map(([c,a]) => `${c}: $${a.toFixed(2)}`).join(", ");

    const ruleData = { totalIncome, totalExpense, topCat, catMap, budget, txnCount: serialized.length, savingsRate };

    // ── Try rule-based first (instant, no API call) ───────────
    const ruleAnswer = ruleBased(message, ruleData);

    // ── Try Gemini with fallback ──────────────────────────────
    const systemPrompt = `You are FinLytics AI, a personal finance advisor with access to the user's real transaction data from the last 3 months.

FINANCIAL SUMMARY:
- Total Income: $${totalIncome.toFixed(2)} ($${(totalIncome/3).toFixed(2)}/month avg)
- Total Expenses: $${totalExpense.toFixed(2)} ($${(totalExpense/3).toFixed(2)}/month avg)
- Net Savings: $${(totalIncome - totalExpense).toFixed(2)}
- Savings Rate: ${savingsRate}%
- Monthly Budget: ${budget ? `$${budget}` : "Not set"}
- Total Transactions: ${serialized.length}
- Top Spending Categories: ${topCats}

RECENT TRANSACTIONS (last 100, newest first):
${JSON.stringify(serialized.slice(0, 100), null, 2)}

INSTRUCTIONS:
- Answer ONLY using the real data above — never invent numbers
- Be concise, specific and actionable
- Use bullet points for lists
- Give real figures from the data
- If you cannot answer from the data, say so honestly`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-001",
        generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
      });

      const cleanHistory = history
        .filter(m => m.content?.trim() && !m.isWelcome && !m.isError)
        .slice(-8)
        .map(m => ({
          role:  m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

      const chat = model.startChat({
        history: [
          { role: "user",  parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I have full access to your financial data and I'm ready to give personalised insights." }] },
          ...cleanHistory,
        ],
      });

      const result = await chat.sendMessage(message);
      return result.response.text();

    } catch (geminiErr) {
      // If Gemini fails (rate limit, quota, network) use rule-based answer
      if (ruleAnswer) return ruleAnswer + "\n\n*Note: AI insights temporarily unavailable — showing rule-based analysis.*";

      if (geminiErr.message?.includes("429") || geminiErr.message?.includes("quota")) {
        throw new Error("AI quota reached for today. Try again tomorrow, or ask about spending, budget, savings rate, or top categories — those work offline.");
      }
      throw geminiErr;
    }

  } catch (err) {
    console.error("FinLytics AI error:", err.message);
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("AI quota reached for today. Basic financial analysis still works — ask about your top spending category, savings rate, or budget.");
    }
    if (err.message?.includes("API_KEY") || err.message?.includes("api key")) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your .env.local file.");
    }
    throw new Error(err.message || "Could not get a response. Please try again.");
  }
}