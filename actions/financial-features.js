"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subMonths, startOfMonth, endOfMonth, format, getDay } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ══════════════════════════════════════════════════════════════
//  EMERGENCY FUND CALCULATOR
// ══════════════════════════════════════════════════════════════
export async function getEmergencyFundData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Average monthly expenses over last 3 months
  const threeMonthsAgo = startOfMonth(subMonths(new Date(), 3));
  const txns = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: threeMonthsAgo },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
          amount: { gt: 0 },
    },
  });

  const totalExpenses = txns.reduce((s, t) => s + Number(t.amount), 0);
  const avgMonthlyExpense = totalExpenses / 3;

  // Current savings (account balances)
  const accounts = await db.account.findMany({ where: { userId: user.id } });
  const totalSavings = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const recommended3Mo = avgMonthlyExpense * 3;
  const recommended6Mo = avgMonthlyExpense * 6;
  const currentCoverage = avgMonthlyExpense > 0 ? totalSavings / avgMonthlyExpense : 0;

  // Classify coverage
  let status, statusColor, advice;
  if (currentCoverage >= 6) {
    status = "Excellent"; statusColor = "green";
    advice = "You have 6+ months of expenses covered. Your emergency fund is fully funded!";
  } else if (currentCoverage >= 3) {
    status = "Good"; statusColor = "blue";
    advice = `You're covered for ${currentCoverage.toFixed(1)} months. Top up to reach the 6-month target.`;
  } else if (currentCoverage >= 1) {
    status = "Fair"; statusColor = "amber";
    advice = `You have ${currentCoverage.toFixed(1)} months covered. Aim to reach 3 months (€${recommended3Mo.toFixed(0)}) first.`;
  } else {
    status = "At Risk"; statusColor = "red";
    advice = "Your emergency fund needs urgent attention. Start with a small monthly contribution.";
  }

  const shortfall3Mo = Math.max(0, recommended3Mo - totalSavings);
  const shortfall6Mo = Math.max(0, recommended6Mo - totalSavings);
  const monthlyToReach3Mo = shortfall3Mo > 0 ? shortfall3Mo / 6 : 0; // 6 months to build
  const monthlyToReach6Mo = shortfall6Mo > 0 ? shortfall6Mo / 12 : 0;

  // Category breakdown for context
  const byCategory = {};
  txns.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount) / 3;
  });

  return {
    avgMonthlyExpense: parseFloat(avgMonthlyExpense.toFixed(2)),
    totalSavings: parseFloat(totalSavings.toFixed(2)),
    recommended3Mo: parseFloat(recommended3Mo.toFixed(2)),
    recommended6Mo: parseFloat(recommended6Mo.toFixed(2)),
    currentCoverage: parseFloat(currentCoverage.toFixed(1)),
    shortfall3Mo: parseFloat(shortfall3Mo.toFixed(2)),
    shortfall6Mo: parseFloat(shortfall6Mo.toFixed(2)),
    monthlyToReach3Mo: parseFloat(monthlyToReach3Mo.toFixed(2)),
    monthlyToReach6Mo: parseFloat(monthlyToReach6Mo.toFixed(2)),
    status,
    statusColor,
    advice,
    topExpenses: Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([cat, amt]) => ({ category: cat, monthly: parseFloat(amt.toFixed(2)) })),
  };
}

// ══════════════════════════════════════════════════════════════
//  AI SAVING SUGGESTIONS
// ══════════════════════════════════════════════════════════════
export async function getAISavingSuggestions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId }, include: { budgets: true } });
  if (!user) throw new Error("User not found");

  const twoMonthsAgo = startOfMonth(subMonths(new Date(), 2));
  const txns = await db.transaction.findMany({
    where: { userId: user.id, type: "EXPENSE", date: { gte: twoMonthsAgo }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
  });

  if (txns.length < 5) {
    return { suggestions: [], totalPotentialSavings: 0, message: "Add more transactions to unlock AI saving suggestions" };
  }

  const byCategory = {};
  txns.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });

  const totalExpense = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const avgMonthly = totalExpense / 2;

  // Build rule-based suggestions first (fast, no API cost)
  const ruleSuggestions = [];

  Object.entries(byCategory).forEach(([cat, total]) => {
    const monthly = total / 2;
    const pct = (monthly / avgMonthly) * 100;

    if (cat === "food" && pct > 15) {
      const saving = monthly * 0.2;
      ruleSuggestions.push({ category: "food", suggestion: `Reducing dining out by 20% could save €${saving.toFixed(0)}/month`, saving: parseFloat(saving.toFixed(2)), icon: "🍔", type: "reduce" });
    }
    if (cat === "entertainment" && monthly > 80) {
      const saving = monthly * 0.3;
      ruleSuggestions.push({ category: "entertainment", suggestion: `Trimming entertainment by 30% saves €${saving.toFixed(0)}/month`, saving: parseFloat(saving.toFixed(2)), icon: "🎬", type: "reduce" });
    }
    if (cat === "shopping" && monthly > 200) {
      const saving = monthly * 0.25;
      ruleSuggestions.push({ category: "shopping", suggestion: `Cutting impulse shopping by 25% saves €${saving.toFixed(0)}/month`, saving: parseFloat(saving.toFixed(2)), icon: "🛍️", type: "reduce" });
    }
    if (cat === "transportation" && monthly > 150) {
      const saving = monthly * 0.15;
      ruleSuggestions.push({ category: "transportation", suggestion: `Optimising transport (carpooling/public) saves €${saving.toFixed(0)}/month`, saving: parseFloat(saving.toFixed(2)), icon: "🚗", type: "optimise" });
    }
  });

  // Gemini AI suggestions
  let aiSuggestions = [];
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const categoryBreakdown = Object.entries(byCategory)
      .map(([cat, total]) => `${cat}: €${(total / 2).toFixed(2)}/month`)
      .join(", ");

    const result = await model.generateContent(`
You are a personal finance advisor. Based on this spending data (monthly averages), provide exactly 3 specific, actionable saving suggestions.
Spending: ${categoryBreakdown}
Total monthly: €${avgMonthly.toFixed(2)}

Return ONLY a JSON array of 3 objects, no markdown, no extra text:
[{"suggestion": "specific advice with exact euro amount", "saving": 45.00, "icon": "💡", "type": "ai", "category": "general"}]
Each saving must be a realistic number based on the actual spending data.`);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) aiSuggestions = parsed.slice(0, 3);
  } catch (e) {
    console.error("AI suggestions error:", e);
  }

  const allSuggestions = [...ruleSuggestions, ...aiSuggestions].slice(0, 6);
  const totalPotentialSavings = allSuggestions.reduce((s, sg) => s + (sg.saving || 0), 0);

  return {
    suggestions: allSuggestions,
    totalPotentialSavings: parseFloat(totalPotentialSavings.toFixed(2)),
    avgMonthlyExpense: parseFloat(avgMonthly.toFixed(2)),
  };
}

// ══════════════════════════════════════════════════════════════
//  SMART BUDGET RECOMMENDATION
// ══════════════════════════════════════════════════════════════
export async function getSmartBudgetRecommendation() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId }, include: { budgets: true } });
  if (!user) throw new Error("User not found");

  const threeMonthsAgo = startOfMonth(subMonths(new Date(), 3));
  const txns = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: threeMonthsAgo }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
  });

  if (txns.length < 5) {
    return { recommendations: [], message: "Add more transactions to get a smart budget recommendation" };
  }

  const income = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const avgMonthlyIncome = income / 3;

  const byCategory = {};
  txns.filter((t) => t.type === "EXPENSE").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount) / 3;
  });

  const totalExpense = Object.values(byCategory).reduce((s, v) => s + v, 0);

  // 50/30/20 rule as baseline, adjusted to actual spending
  const needsCategories = ["housing", "utilities", "groceries", "transportation", "healthcare", "insurance", "bills"];
  const wantsCategories = ["food", "entertainment", "shopping", "personal", "travel"];
  const savingsTarget = avgMonthlyIncome * 0.20;

  const recommendations = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, avgSpend]) => {
      const isNeed = needsCategories.includes(category);
      const pct = avgMonthlyIncome > 0 ? (avgSpend / avgMonthlyIncome) * 100 : 0;

      // Recommended: needs ≤ 50% of income, wants ≤ 30%, savings ≥ 20%
      let recommended = avgSpend;
      if (!isNeed && avgSpend > avgMonthlyIncome * 0.08) {
        recommended = avgMonthlyIncome * 0.08; // cap wants at 8% per category
      }

      const status = avgSpend > recommended * 1.1 ? "over" : avgSpend < recommended * 0.85 ? "under" : "optimal";

      return {
        category,
        current: parseFloat(avgSpend.toFixed(2)),
        recommended: parseFloat(recommended.toFixed(2)),
        pct: parseFloat(pct.toFixed(1)),
        type: isNeed ? "need" : "want",
        status,
      };
    });

  // AI narrative
  let narrative = "";
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`
Based on monthly income of €${avgMonthlyIncome.toFixed(0)} and these spending averages: ${Object.entries(byCategory).map(([k, v]) => `${k}: €${v.toFixed(0)}`).join(", ")}.
Give a 2-sentence smart budget recommendation. Be specific with numbers. No markdown.`);
    narrative = result.response.text().trim();
  } catch (e) { /* silent fail */ }

  return {
    recommendations: recommendations.slice(0, 8),
    avgMonthlyIncome: parseFloat(avgMonthlyIncome.toFixed(2)),
    totalExpense: parseFloat(totalExpense.toFixed(2)),
    savingsTarget: parseFloat(savingsTarget.toFixed(2)),
    narrative,
    rule: "50/30/20",
  };
}

// ══════════════════════════════════════════════════════════════
//  COST OF LIVING TRACKER
// ══════════════════════════════════════════════════════════════
export async function getCostOfLivingData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const start = startOfMonth(subMonths(new Date(), i));
    const end = endOfMonth(subMonths(new Date(), i));
    const txns = await db.transaction.findMany({
      where: { userId: user.id, type: "EXPENSE", date: { gte: start, lte: end }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
    });

    const byCategory = {};
    txns.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount); });

    // Map to cost-of-living buckets
    const bucket = {
      month: format(start, "MMM"),
      housing: parseFloat(((byCategory.housing || 0)).toFixed(2)),
      food: parseFloat(((byCategory.food || 0) + (byCategory.groceries || 0)).toFixed(2)),
      transport: parseFloat(((byCategory.transportation || 0)).toFixed(2)),
      utilities: parseFloat(((byCategory.utilities || 0) + (byCategory.bills || 0)).toFixed(2)),
      other: parseFloat((Object.entries(byCategory)
        .filter(([k]) => !["housing","food","groceries","transportation","utilities","bills"].includes(k))
        .reduce((s, [, v]) => s + v, 0)).toFixed(2)),
    };
    bucket.total = parseFloat((bucket.housing + bucket.food + bucket.transport + bucket.utilities + bucket.other).toFixed(2));
    months.push(bucket);
  }

  // Weekend vs weekday breakdown (last 30 days)
  const thirtyDaysAgo = subMonths(new Date(), 1);
  const recentTxns = await db.transaction.findMany({
    where: { userId: user.id, type: "EXPENSE", date: { gte: thirtyDaysAgo }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
  });

  let weekdaySpend = 0, weekendSpend = 0, weekdayCount = 0, weekendCount = 0;
  recentTxns.forEach((t) => {
    const dow = getDay(new Date(t.date));
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend) { weekendSpend += Number(t.amount); weekendCount++; }
    else { weekdaySpend += Number(t.amount); weekdayCount++; }
  });

  const avgWeekday = weekdayCount > 0 ? weekdaySpend / weekdayCount : 0;
  const avgWeekend = weekendCount > 0 ? weekendSpend / weekendCount : 0;

  const currentMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];
  const momChange = prevMonth?.total > 0 ? ((currentMonth.total - prevMonth.total) / prevMonth.total) * 100 : 0;

  return {
    months,
    currentMonth,
    momChange: parseFloat(momChange.toFixed(1)),
    weekdaySpend: parseFloat(weekdaySpend.toFixed(2)),
    weekendSpend: parseFloat(weekendSpend.toFixed(2)),
    avgWeekday: parseFloat(avgWeekday.toFixed(2)),
    avgWeekend: parseFloat(avgWeekend.toFixed(2)),
    weekendIsHigher: avgWeekend > avgWeekday,
  };
}