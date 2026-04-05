"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getBudgetVsActual() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { budgets: true },
  });
  if (!user) throw new Error("User not found");

  const budget = user.budgets[0];
  const totalBudget = budget ? Number(budget.amount) : null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const txns = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: monthStart, lte: monthEnd },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
    },
  });

  // Group by category
  const byCategory = {};
  txns.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });

  const totalSpent = Object.values(byCategory).reduce((s, v) => s + v, 0);

  // Budget distribution — split total budget proportionally across categories
  const categories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([category, actual]) => {
      const pct = totalSpent > 0 ? actual / totalSpent : 0;
      const allocated = totalBudget ? totalBudget * pct : null;
      const overBudget = allocated ? actual > allocated : false;
      return {
        category,
        actual: parseFloat(actual.toFixed(2)),
        budget: allocated ? parseFloat(allocated.toFixed(2)) : null,
        overBudget,
        pct: parseFloat((pct * 100).toFixed(1)),
      };
    });

  const daysInMonth = monthEnd.getDate();
  const daysPassed = now.getDate();
  const expectedSpend = totalBudget ? (totalBudget / daysInMonth) * daysPassed : null;
  const budgetStatus = expectedSpend
    ? totalSpent > expectedSpend * 1.1 ? "over"
    : totalSpent < expectedSpend * 0.85 ? "under"
    : "on-track"
    : null;

  return {
    totalBudget,
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    remaining: totalBudget ? parseFloat((totalBudget - totalSpent).toFixed(2)) : null,
    pctUsed: totalBudget ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : null,
    expectedSpend: expectedSpend ? parseFloat(expectedSpend.toFixed(2)) : null,
    budgetStatus,
    categories,
    hasBudget: !!budget,
    daysPassed,
    daysInMonth,
  };
}