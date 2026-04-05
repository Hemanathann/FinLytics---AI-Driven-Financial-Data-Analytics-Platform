"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function detectSubscriptions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const threeMonthsAgo = startOfMonth(subMonths(new Date(), 3));
  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: threeMonthsAgo },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
    },
    orderBy: { date: "asc" },
  });

  const txns = transactions.map((t) => ({ ...t, amount: Number(t.amount) }));

  // Group by description (merchant)
  const merchantMap = {};
  txns.forEach((t) => {
    const key = (t.description || "unknown").toLowerCase().trim();
    if (!merchantMap[key]) merchantMap[key] = [];
    merchantMap[key].push(t);
  });

  const subscriptions = [];

  Object.entries(merchantMap).forEach(([key, items]) => {
    if (items.length < 2) return;

    // Check if amounts are similar (within 10%)
    const amounts = items.map((t) => t.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.15);

    if (!allSimilar) return;

    // Check if dates are roughly periodic (monthly ± 5 days)
    if (items.length >= 2) {
      const dates = items.map((t) => new Date(t.date)).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      }
      const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

      let frequency = null;
      if (avgGap >= 25 && avgGap <= 35) frequency = "monthly";
      else if (avgGap >= 6 && avgGap <= 8) frequency = "weekly";
      else if (avgGap >= 12 && avgGap <= 16) frequency = "bi-weekly";
      else if (avgGap >= 85 && avgGap <= 95) frequency = "quarterly";

      if (frequency) {
        const lastTxn = items[items.length - 1];
        subscriptions.push({
          id: lastTxn.id,
          name: lastTxn.description || key,
          category: lastTxn.category,
          amount: parseFloat(avgAmount.toFixed(2)),
          frequency,
          monthlyEquivalent: frequency === "weekly" ? parseFloat((avgAmount * 4.33).toFixed(2))
            : frequency === "bi-weekly" ? parseFloat((avgAmount * 2.17).toFixed(2))
            : frequency === "quarterly" ? parseFloat((avgAmount / 3).toFixed(2))
            : parseFloat(avgAmount.toFixed(2)),
          lastCharged: format(new Date(lastTxn.date), "MMM d, yyyy"),
          occurrences: items.length,
        });
      }
    }
  });

  // Also include explicitly marked recurring transactions
  const explicitRecurring = txns.filter((t) => t.isRecurring);
  explicitRecurring.forEach((t) => {
    const alreadyDetected = subscriptions.some((s) =>
      (s.name || "").toLowerCase() === (t.description || "").toLowerCase()
    );
    if (!alreadyDetected) {
      subscriptions.push({
        id: t.id,
        name: t.description || t.category,
        category: t.category,
        amount: t.amount,
        frequency: t.recurringInterval?.toLowerCase() || "monthly",
        monthlyEquivalent: t.amount,
        lastCharged: format(new Date(t.date), "MMM d, yyyy"),
        occurrences: 1,
        explicit: true,
      });
    }
  });

  subscriptions.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
  const totalMonthly = subscriptions.reduce((s, sub) => s + sub.monthlyEquivalent, 0);
  const totalAnnual = totalMonthly * 12;

  return {
    subscriptions,
    totalMonthly: parseFloat(totalMonthly.toFixed(2)),
    totalAnnual: parseFloat(totalAnnual.toFixed(2)),
  };
}