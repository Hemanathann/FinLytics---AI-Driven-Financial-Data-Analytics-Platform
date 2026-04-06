"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format, addMonths } from "date-fns";

export async function getSpendingForecast() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  // Get 6 months of data for the model
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const transactions = await db.transaction.findMany({
    where: { userId: user.id, type: "EXPENSE", date: { gte: sixMonthsAgo }, status: "COMPLETED", amount: { gt: 0 } },
    orderBy: { date: "asc" },
  });

  const txns = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));

  // Build monthly totals (x = month index 0..5, y = spend)
  const monthlyTotals = [];
  for (let i = 0; i < 6; i++) {
    const month = subMonths(now, 5 - i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const total = txns
      .filter((t) => new Date(t.date) >= start && new Date(t.date) <= end)
      .reduce((s, t) => s + t.amount, 0);
    monthlyTotals.push({
      label: format(month, "MMM yyyy"),
      x: i,
      y: parseFloat(total.toFixed(2)),
    });
  }

  const nonZero = monthlyTotals.filter((m) => m.y > 0);
  if (nonZero.length < 2) {
    return { forecast: null, monthlyTotals, message: "Not enough data for a forecast yet" };
  }

  // ── Simple linear regression ─────────────────────────────────
  const n = monthlyTotals.length;
  const sumX = monthlyTotals.reduce((s, m) => s + m.x, 0);
  const sumY = monthlyTotals.reduce((s, m) => s + m.y, 0);
  const sumXY = monthlyTotals.reduce((s, m) => s + m.x * m.y, 0);
  const sumX2 = monthlyTotals.reduce((s, m) => s + m.x ** 2, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;

  // Predict month index 6 (next month)
  const predictedRaw = intercept + slope * 6;
  // Clamp: can't predict negative spend; don't predict > 3× average
  const avgSpend = sumY / nonZero.length;
  const predicted = Math.max(0, Math.min(predictedRaw, avgSpend * 3));

  // Build chart series including prediction
  const chartData = monthlyTotals.map((m) => ({
    ...m,
    predicted: parseFloat((intercept + slope * m.x).toFixed(2)),
  }));

  const nextMonthLabel = format(addMonths(now, 1), "MMM yyyy");
  chartData.push({
    label: nextMonthLabel + " (forecast)",
    x: 6,
    y: null,
    predicted: parseFloat(predicted.toFixed(2)),
  });

  // Trend description
  const trend = slope > 10 ? "increasing" : slope < -10 ? "decreasing" : "stable";
  const changeAbs = Math.abs(slope * 6 - slope * 5);
  const changeText =
    trend === "stable"
      ? "roughly stable"
      : `${trend} by ~€${changeAbs.toFixed(0)}/month`;

  return {
    forecast: {
      amount: parseFloat(predicted.toFixed(2)),
      month: nextMonthLabel,
      trend,
      changeText,
      confidence: nonZero.length >= 4 ? "high" : "moderate",
    },
    chartData,
    message: null,
  };
}