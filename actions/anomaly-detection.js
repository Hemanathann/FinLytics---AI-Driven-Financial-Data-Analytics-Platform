"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function detectAnomalies() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Get 4 months of transactions (3 months baseline + current month)
  const fourMonthsAgo = startOfMonth(subMonths(new Date(), 3));
  const transactions = await db.transaction.findMany({
    where: { userId: user.id, type: "EXPENSE", date: { gte: fourMonthsAgo }, status: "COMPLETED" },
    orderBy: { date: "desc" },
  });

  const txns = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));

  if (txns.length < 5) return { anomalies: [], message: "Not enough data yet" };

  // ── Z-score detection per category ──────────────────────────
  // Group last 3 months as baseline, current month as "new" data
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const baselineTxns = txns.filter((t) => new Date(t.date) < currentMonthStart);
  const currentTxns = txns.filter((t) => new Date(t.date) >= currentMonthStart);

  // Build category stats from baseline
  const categoryStats = {};
  baselineTxns.forEach((t) => {
    if (!categoryStats[t.category]) categoryStats[t.category] = [];
    categoryStats[t.category].push(t.amount);
  });

  // Compute mean and std dev per category
  const categoryParams = {};
  Object.entries(categoryStats).forEach(([cat, amounts]) => {
    if (amounts.length < 2) return;
    const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const std = Math.sqrt(variance);
    categoryParams[cat] = { mean, std, count: amounts.length };
  });

  // ── Also detect large absolute spends (top 5% rule) ─────────
  const allAmounts = txns.map((t) => t.amount).sort((a, b) => a - b);
  const p95 = allAmounts[Math.floor(allAmounts.length * 0.95)] || Infinity;

  // Check current month transactions for anomalies
  const anomalies = [];

  currentTxns.forEach((t) => {
    const params = categoryParams[t.category];
    let isAnomaly = false;
    let reason = "";
    let severity = "medium";
    let zScore = 0;

    if (params && params.std > 0) {
      zScore = (t.amount - params.mean) / params.std;
      if (zScore > 2.0) {
        isAnomaly = true;
        const multiplier = (t.amount / params.mean).toFixed(1);
        reason = `${multiplier}× your usual spend in ${t.category} (avg: €${params.mean.toFixed(0)})`;
        severity = zScore > 3 ? "high" : "medium";
      }
    }

    // Large absolute amount check
    if (!isAnomaly && t.amount >= p95 && t.amount > 100) {
      isAnomaly = true;
      reason = `Unusually large transaction — top 5% of all your expenses`;
      severity = "medium";
    }

    if (isAnomaly) {
      anomalies.push({
        id: t.id,
        date: format(new Date(t.date), "MMM d, yyyy"),
        description: t.description || "No description",
        category: t.category,
        amount: t.amount,
        reason,
        severity,
        zScore: parseFloat(zScore.toFixed(2)),
      });
    }
  });

  // Sort by severity then amount
  anomalies.sort((a, b) => {
    const sv = { high: 0, medium: 1, low: 2 };
    return (sv[a.severity] - sv[b.severity]) || b.amount - a.amount;
  });

  return { anomalies: anomalies.slice(0, 10), message: null };
}