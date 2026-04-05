"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function getNetWorthData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, type: true, balance: true },
  });

  const totalAssets = accounts
    .filter((a) => a.type === "SAVINGS" || a.type === "CURRENT")
    .reduce((sum, a) => sum + Number(a.balance), 0);

  // Build month-by-month net worth history (6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = startOfMonth(subMonths(new Date(), i - 1));

    const txns = await db.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: monthStart, lt: i === 0 ? new Date() : monthEnd },
        status: "COMPLETED",
        NOT: { category: "savings-goal-meta" },
      },
    });

    const income = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const expense = txns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

    months.push({
      month: format(monthStart, "MMM yyyy"),
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      net: parseFloat((income - expense).toFixed(2)),
    });
  }

  // Cumulative net worth from account balance going backwards
  let runningNW = totalAssets;
  const netWorthHistory = [...months].reverse().map((m) => {
    const nw = runningNW;
    runningNW -= m.net;
    return nw;
  }).reverse();

  const chartData = months.map((m, i) => ({
    ...m,
    netWorth: parseFloat(netWorthHistory[i].toFixed(2)),
  }));

  const currentNetWorth = totalAssets;
  const prevNetWorth = chartData.length >= 2 ? chartData[chartData.length - 2].netWorth : currentNetWorth;
  const change = currentNetWorth - prevNetWorth;
  const changePct = prevNetWorth !== 0 ? ((change / Math.abs(prevNetWorth)) * 100).toFixed(1) : 0;

  return {
    currentNetWorth: parseFloat(currentNetWorth.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePct: parseFloat(changePct),
    chartData,
    accounts: accounts.map((a) => ({ ...a, balance: Number(a.balance) })),
  };
}