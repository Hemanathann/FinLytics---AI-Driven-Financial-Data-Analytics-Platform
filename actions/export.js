"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subMonths, startOfMonth, format } from "date-fns";

export async function exportTransactionsCSV() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: sixMonthsAgo },
      status: "COMPLETED",
      NOT: { category: "savings-goal-meta" },
    },
    orderBy: { date: "desc" },
    include: { account: { select: { name: true } } },
  });

  const rows = [
    ["Date", "Type", "Category", "Description", "Amount", "Account", "Recurring"],
    ...transactions.map((t) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.type,
      t.category,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      Number(t.amount).toFixed(2),
      t.account?.name || "",
      t.isRecurring ? "Yes" : "No",
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  return { csv, filename: `welth-transactions-${format(new Date(), "yyyy-MM-dd")}.csv` };
}