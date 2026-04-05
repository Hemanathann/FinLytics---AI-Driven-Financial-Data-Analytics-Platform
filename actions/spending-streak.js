"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subDays, format, startOfDay, isSameDay } from "date-fns";

export async function getSpendingStreak() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const budget = await db.budget.findFirst({ where: { userId: user.id } });
  const dailyLimit = budget ? Number(budget.amount) / 30 : null;

  // Get last 60 days of expense transactions
  const since = subDays(new Date(), 60);
  const txns = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: "EXPENSE",
      date: { gte: since },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
    },
    orderBy: { date: "desc" },
  });

  // Group by day
  const byDay = {};
  txns.forEach((t) => {
    const key = format(new Date(t.date), "yyyy-MM-dd");
    byDay[key] = (byDay[key] || 0) + Number(t.amount);
  });

  // Calculate streak: consecutive days where spending < daily limit (or just no overspend days)
  // If no budget, streak = consecutive days with ANY spending (active tracking streak)
  let streak = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  const today = new Date();

  // Last 30 days for display
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, i);
    const key = format(date, "yyyy-MM-dd");
    const spent = byDay[key] || 0;
    const underLimit = dailyLimit ? spent <= dailyLimit : spent > 0;
    return { date: key, spent: parseFloat(spent.toFixed(2)), underLimit, hasActivity: spent > 0 };
  }).reverse();

  // Calculate current streak going backwards from today
  for (let i = last30.length - 1; i >= 0; i--) {
    const day = last30[i];
    const condition = dailyLimit ? day.underLimit : day.hasActivity;
    if (condition) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak
  let temp = 0;
  last30.forEach((day) => {
    const condition = dailyLimit ? day.underLimit : day.hasActivity;
    if (condition) { temp++; longestStreak = Math.max(longestStreak, temp); }
    else { temp = 0; }
  });

  const streakType = dailyLimit ? "days under daily limit" : "active tracking days";
  const emoji = currentStreak >= 14 ? "🏆" : currentStreak >= 7 ? "🔥" : currentStreak >= 3 ? "⚡" : currentStreak >= 1 ? "✅" : "💤";

  return {
    currentStreak,
    longestStreak,
    streakType,
    emoji,
    dailyLimit: dailyLimit ? parseFloat(dailyLimit.toFixed(2)) : null,
    last30,
    hasBudget: !!budget,
  };
}