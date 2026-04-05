"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getAIInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { budgets: true },
  });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const threeMonthsAgo = startOfMonth(subMonths(now, 2));
  const transactions = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: threeMonthsAgo }, status: "COMPLETED" },
    orderBy: { date: "asc" },
  });

  const txns = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));
  if (txns.length < 3) {
    return {
      insights: [],
      narrative: "Add more transactions to unlock AI-powered insights.",
    };
  }

  const budget = user.budgets[0] ? Number(user.budgets[0].amount) : null;
  const totalIncome = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  // Category totals
  const categoryMap = {};
  txns.filter((t) => t.type === "EXPENSE").forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];

  // Month-over-month
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const thisMonthExp = txns.filter((t) => t.type === "EXPENSE" && new Date(t.date) >= thisMonthStart).reduce((s, t) => s + t.amount, 0);
  const lastMonthExp = txns.filter((t) => t.type === "EXPENSE" && new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd).reduce((s, t) => s + t.amount, 0);
  const momChange = lastMonthExp > 0 ? ((thisMonthExp - lastMonthExp) / lastMonthExp) * 100 : 0;

  // Recurring / subscription spends
  const recurringTxns = txns.filter((t) => t.isRecurring && t.type === "EXPENSE");
  const recurringTotal = recurringTxns.reduce((s, t) => s + t.amount, 0);

  // ── Rule-based insights ──────────────────────────────────────
  const insights = [];

  if (topCategory) {
    const pct = ((topCategory[1] / totalExpense) * 100).toFixed(0);
    insights.push({
      type: "category",
      icon: "pie",
      text: `You spend ${pct}% of your expenses on ${topCategory[0]} (€${topCategory[1].toFixed(0)} over 3 months).`,
      severity: pct > 40 ? "warning" : "info",
    });
  }

  if (momChange !== 0 && lastMonthExp > 0) {
    const dir = momChange > 0 ? "increased" : "decreased";
    insights.push({
      type: "trend",
      icon: "trend",
      text: `Your spending ${dir} by ${Math.abs(momChange).toFixed(0)}% compared to last month.`,
      severity: momChange > 20 ? "warning" : momChange < -10 ? "success" : "info",
    });
  }

  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
    if (savingsRate < 10) {
      insights.push({
        type: "savings",
        icon: "alert",
        text: `Your savings rate is ${savingsRate.toFixed(0)}% — below the recommended 20%. Try cutting back on discretionary spend.`,
        severity: "warning",
      });
    } else {
      insights.push({
        type: "savings",
        icon: "check",
        text: `Great work — you're saving ${savingsRate.toFixed(0)}% of your income over the last 3 months.`,
        severity: "success",
      });
    }
  }

  if (recurringTotal > 0) {
    insights.push({
      type: "recurring",
      icon: "repeat",
      text: `You have €${recurringTotal.toFixed(0)} in recurring charges. Review if all subscriptions are still needed.`,
      severity: "info",
    });
  }

  if (budget && thisMonthExp > budget * 0.9) {
    const pct = ((thisMonthExp / budget) * 100).toFixed(0);
    insights.push({
      type: "budget",
      icon: "alert",
      text: `You've used ${pct}% of your monthly budget. ${thisMonthExp > budget ? "You're over budget." : "You're close to your limit."}`,
      severity: thisMonthExp > budget ? "warning" : "info",
    });
  }

  // ── Gemini narrative paragraph ───────────────────────────────
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
You are a concise personal finance advisor. Based on this data, write ONE short paragraph (3-4 sentences max) of personalised financial insight. Be specific with numbers. No generic advice.

Data:
- 3-month total income: €${totalIncome.toFixed(0)}
- 3-month total expense: €${totalExpense.toFixed(0)}
- Savings rate: ${totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(0) : 0}%
- Top spending category: ${topCategory ? topCategory[0] + " ($" + topCategory[1].toFixed(0) + ")" : "N/A"}
- Month-over-month change: ${momChange.toFixed(0)}%
- Recurring/subscription spend: $${recurringTotal.toFixed(0)}
- Monthly budget: ${budget ? "€" + budget : "not set"}

Write in second person ("you"). Output only the paragraph, no headers or bullets.
  `.trim();

  let narrative = "";
  try {
    const result = await model.generateContent(prompt);
    narrative = result.response.text().trim();
  } catch {
    narrative = "Unable to generate AI narrative at this time.";
  }

  return { insights, narrative };
}