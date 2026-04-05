"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getHealthScore() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { budgets: true },
  });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const threeMonthsAgo = startOfMonth(subMonths(now, 3));

  const transactions = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: threeMonthsAgo }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
    orderBy: { date: "asc" },
  });

  const serialized = transactions.map((t) => ({
    ...t,
    amount: t.amount.toNumber(),
  }));

  const budget = user.budgets[0];
  const budgetAmount = budget ? Number(budget.amount) : null;

  // ── 1. Savings Rate Score (0–30 pts) ──────────────────────────
  const totalIncome = serialized
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = serialized
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const savingsRate =
    totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

  let savingsScore = 0;
  let savingsStatus = "poor";
  if (savingsRate >= 0.2) { savingsScore = 30; savingsStatus = "excellent"; }
  else if (savingsRate >= 0.1) { savingsScore = 20; savingsStatus = "good"; }
  else if (savingsRate >= 0.05) { savingsScore = 12; savingsStatus = "fair"; }
  else if (savingsRate > 0) { savingsScore = 5; savingsStatus = "poor"; }

  // ── 2. Budget Adherence Score (0–25 pts) ──────────────────────
  let budgetScore = 12; // neutral if no budget set
  let budgetStatus = "no budget";
  if (budgetAmount) {
    const currentMonthExpense = serialized
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "EXPENSE" &&
          d >= startOfMonth(now) &&
          d <= endOfMonth(now)
        );
      })
      .reduce((s, t) => s + t.amount, 0);
    const ratio = currentMonthExpense / budgetAmount;
    if (ratio <= 0.7) { budgetScore = 25; budgetStatus = "excellent"; }
    else if (ratio <= 0.9) { budgetScore = 18; budgetStatus = "good"; }
    else if (ratio <= 1.0) { budgetScore = 10; budgetStatus = "fair"; }
    else { budgetScore = 0; budgetStatus = "over budget"; }
  }

  // ── 3. Spending Consistency Score (0–25 pts) ──────────────────
  const monthlyExpenses = [];
  for (let i = 0; i < 3; i++) {
    const m = subMonths(now, i);
    const exp = serialized
      .filter((t) => {
        const d = new Date(t.date);
        return (
          t.type === "EXPENSE" &&
          d >= startOfMonth(m) &&
          d <= endOfMonth(m)
        );
      })
      .reduce((s, t) => s + t.amount, 0);
    monthlyExpenses.push(exp);
  }
  const avgExp =
    monthlyExpenses.reduce((s, e) => s + e, 0) / monthlyExpenses.length || 1;
  const variance =
    monthlyExpenses.reduce((s, e) => s + Math.abs(e - avgExp), 0) /
    monthlyExpenses.length;
  const cvRatio = variance / avgExp;

  let consistencyScore = 0;
  let consistencyStatus = "poor";
  if (cvRatio < 0.1) { consistencyScore = 25; consistencyStatus = "excellent"; }
  else if (cvRatio < 0.2) { consistencyScore = 18; consistencyStatus = "good"; }
  else if (cvRatio < 0.35) { consistencyScore = 10; consistencyStatus = "fair"; }
  else { consistencyScore = 3; consistencyStatus = "poor"; }

  // ── 4. Expense Diversity Score (0–20 pts) ─────────────────────
  const categoryCount = new Set(
    serialized.filter((t) => t.type === "EXPENSE").map((t) => t.category)
  ).size;
  // Penalise if one category dominates (>60% of spending)
  const categoryTotals = serialized
    .filter((t) => t.type === "EXPENSE")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const maxCatPct =
    totalExpense > 0
      ? Math.max(...Object.values(categoryTotals)) / totalExpense
      : 0;

  let diversityScore = 0;
  let diversityStatus = "poor";
  if (categoryCount >= 5 && maxCatPct < 0.4) { diversityScore = 20; diversityStatus = "excellent"; }
  else if (categoryCount >= 3 && maxCatPct < 0.6) { diversityScore = 14; diversityStatus = "good"; }
  else if (categoryCount >= 2) { diversityScore = 8; diversityStatus = "fair"; }
  else { diversityScore = 2; diversityStatus = "poor"; }

  // ── Total ──────────────────────────────────────────────────────
  const totalScore = savingsScore + budgetScore + consistencyScore + diversityScore;

  // ── Tips ──────────────────────────────────────────────────────
  const tips = [];
  if (savingsStatus === "poor" || savingsStatus === "fair")
    tips.push("Try to save at least 10% of your income each month.");
  if (budgetStatus === "over budget")
    tips.push("You've exceeded your monthly budget — review your top spending categories.");
  if (budgetStatus === "no budget")
    tips.push("Set a monthly budget to track your spending limits.");
  if (consistencyStatus === "poor" || consistencyStatus === "fair")
    tips.push("Your monthly spending varies a lot — try to keep it more predictable.");
  if (diversityStatus === "poor")
    tips.push("Your spending is concentrated in very few categories — check if that's intentional.");
  if (tips.length === 0)
    tips.push("Great job! Keep up your healthy financial habits.");

  return {
    totalScore,
    breakdown: [
      {
        label: "Savings Rate",
        score: savingsScore,
        max: 30,
        status: savingsStatus,
        detail: `${(savingsRate * 100).toFixed(1)}% savings rate`,
      },
      {
        label: "Budget Adherence",
        score: budgetScore,
        max: 25,
        status: budgetStatus,
        detail: budgetAmount ? `vs €${budgetAmount} budget` : "No budget set",
      },
      {
        label: "Spending Consistency",
        score: consistencyScore,
        max: 25,
        status: consistencyStatus,
        detail: `${(cvRatio * 100).toFixed(0)}% monthly variation`,
      },
      {
        label: "Expense Diversity",
        score: diversityScore,
        max: 20,
        status: diversityStatus,
        detail: `${categoryCount} spending categories`,
      },
    ],
    tips,
    stats: { totalIncome, totalExpense, savingsRate },
  };
}