"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: account };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // Check it's not the only account
    const accountCount = await db.account.count({ where: { userId: user.id } });
    if (accountCount <= 1) throw new Error("Cannot delete your only account");

    // Check it's not the default account
    const account = await db.account.findUnique({ where: { id: accountId, userId: user.id } });
    if (!account) throw new Error("Account not found");
    if (account.isDefault) throw new Error("Cannot delete the default account. Set another account as default first.");

    // Delete all transactions and the account
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId, userId: user.id } });
      await tx.account.delete({ where: { id: accountId, userId: user.id } });
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(accountId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await db.account.findUnique({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: { orderBy: { date: "desc" } },
      _count: { select: { transactions: true } },
    },
  });

  if (!account) return null;

  return {
    ...account,
    transactions: account.transactions.map((t) => ({
      ...t,
      amount: t.amount.toNumber(),
    })),
  };
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionIds }, userId: user.id },
    });

    const accountBalanceChanges = transactions.reduce((acc, t) => {
      const change = t.type === "EXPENSE" ? t.amount : -t.amount;
      acc[t.accountId] = (acc[t.accountId] || 0) + Number(change);
      return acc;
    }, {});

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds }, userId: user.id },
      });
      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}