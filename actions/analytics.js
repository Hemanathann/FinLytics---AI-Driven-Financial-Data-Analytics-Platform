"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format, eachDayOfInterval, subDays } from "date-fns";

export async function getAnalyticsData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const transactions = await db.transaction.findMany({
    where: { userId: user.id, date: { gte: sixMonthsAgo }, status: "COMPLETED", NOT: { category: "savings-goal-meta" } },
    orderBy: { date: "asc" },
  });

  const txns = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));

  // ── Monthly summary (last 6 months) ─────────────────────────
  const monthlySummary = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthTxns = txns.filter((t) => new Date(t.date) >= start && new Date(t.date) <= end);
    const income = monthTxns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = monthTxns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
    monthlySummary.push({
      month: format(month, "MMM yyyy"),
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      net: parseFloat((income - expense).toFixed(2)),
    });
  }

  // ── Category breakdown ───────────────────────────────────────
  const expenseTxns = txns.filter((t) => t.type === "EXPENSE");
  const totalExpense = expenseTxns.reduce((s, t) => s + t.amount, 0);
  const categoryMap = {};
  expenseTxns.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: totalExpense > 0 ? parseFloat(((amount / totalExpense) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── Daily spending trend (last 30 days) ─────────────────────
  const thirtyDaysAgo = subDays(now, 29);
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const dailySpending = days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayTxns = txns.filter(
      (t) => t.type === "EXPENSE" && format(new Date(t.date), "yyyy-MM-dd") === dayStr
    );
    return {
      date: format(day, "MMM d"),
      amount: parseFloat(dayTxns.reduce((s, t) => s + t.amount, 0).toFixed(2)),
    };
  });

  // ── Weekly spending (last 8 weeks) ───────────────────────────
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = subDays(now, i * 7 + 6);
    const weekEnd = subDays(now, i * 7);
    const weekTxns = txns.filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date) >= weekStart &&
        new Date(t.date) <= weekEnd
    );
    weeklyData.push({
      week: format(weekStart, "MMM d"),
      amount: parseFloat(weekTxns.reduce((s, t) => s + t.amount, 0).toFixed(2)),
    });
  }

  // ── Top merchants / descriptions ────────────────────────────
  const merchantMap = {};
  expenseTxns.forEach((t) => {
    const key = t.description || "Unknown";
    if (!merchantMap[key]) merchantMap[key] = { count: 0, total: 0 };
    merchantMap[key].count += 1;
    merchantMap[key].total += t.amount;
  });
  const topMerchants = Object.entries(merchantMap)
    .map(([merchant, data]) => ({
      merchant,
      count: data.count,
      total: parseFloat(data.total.toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // ── Spending heatmap (last 12 weeks × 7 days) ────────────────
  const heatmapDays = eachDayOfInterval({ start: subDays(now, 83), end: now });
  const heatmapData = heatmapDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const amount = txns
      .filter(
        (t) => t.type === "EXPENSE" && format(new Date(t.date), "yyyy-MM-dd") === dayStr
      )
      .reduce((s, t) => s + t.amount, 0);
    return { date: dayStr, amount: parseFloat(amount.toFixed(2)) };
  });

  // ── Summary stats ─────────────────────────────────────────────
  const totalIncome = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const avgMonthlySpend = totalExpense / 6;
  const thisMonthStart = startOfMonth(now);
  const thisMonthExpense = txns
    .filter((t) => t.type === "EXPENSE" && new Date(t.date) >= thisMonthStart)
    .reduce((s, t) => s + t.amount, 0);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const lastMonthExpense = txns
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date) >= lastMonthStart &&
        new Date(t.date) <= lastMonthEnd
    )
    .reduce((s, t) => s + t.amount, 0);

  const monthOverMonthChange =
    lastMonthExpense > 0
      ? parseFloat((((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100).toFixed(1))
      : 0;

  return {
    monthlySummary,
    categoryBreakdown,
    dailySpending,
    weeklyData,
    topMerchants,
    heatmapData,
    topCategories: categoryBreakdown.slice(0, 5),
    stats: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      netSavings: parseFloat((totalIncome - totalExpense).toFixed(2)),
      thisMonthExpense: parseFloat(thisMonthExpense.toFixed(2)),
      avgMonthlySpend: parseFloat(avgMonthlySpend.toFixed(2)),
      transactionCount: txns.length,
      savingsRate: totalIncome > 0 ? parseFloat(((1 - totalExpense / totalIncome) * 100).toFixed(1)) : 0,
      monthOverMonthChange,
    },
  };
}