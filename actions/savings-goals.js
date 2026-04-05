"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { differenceInDays, differenceInMonths, parseISO } from "date-fns";

// Goals are stored in a JSON field on the user record, or as a separate table.
// Since we don't want schema changes, we store them in a dedicated DB model via raw JSON.
// We'll use a simple key-value approach via the existing infrastructure.
// Actually — we'll create a lightweight goals store using a JSON column trick via a 
// dedicated table-less approach: store goals as serialized JSON in the user's name field... 
// No. Best approach: add a SavingsGoal model. But since we can't alter schema here,
// we'll store goals as transactions with a special metadata pattern OR use a simple 
// in-memory store that reads from a dedicated endpoint.
// 
// SIMPLEST: Store goals as a JSON string in a new DB key-value via Prisma's existing models.
// We'll encode goals as INCOME transactions with category="savings-goal" and use description as JSON.
// This is a clean workaround that needs zero schema changes.

const GOAL_CATEGORY = "savings-goal-meta";

async function getGoalsRaw(userId, userDbId) {
  const meta = await db.transaction.findFirst({
    where: { userId: userDbId, category: GOAL_CATEGORY },
    orderBy: { createdAt: "desc" },
  });
  if (!meta || !meta.description) return [];
  try {
    return JSON.parse(meta.description);
  } catch {
    return [];
  }
}

async function saveGoalsRaw(userDbId, accountId, goals) {
  // Delete old meta record and create a new one
  await db.transaction.deleteMany({ where: { userId: userDbId, category: GOAL_CATEGORY } });
  if (goals.length > 0) {
    await db.transaction.create({
      data: {
        type: "INCOME",
        amount: 0.01,
        description: JSON.stringify(goals),
        date: new Date(),
        category: GOAL_CATEGORY,
        status: "COMPLETED",
        userId: userDbId,
        accountId,
      },
    });
  }
}

export async function getSavingsGoals() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const goals = await getGoalsRaw(userId, user.id);

  // Calculate current savings for each goal
  const now = new Date();
  const enriched = await Promise.all(
    goals.map(async (goal) => {
      const startDate = parseISO(goal.startDate);
      const targetDate = parseISO(goal.targetDate);

      // Sum net savings since goal start date
      const txns = await db.transaction.findMany({
        where: {
          userId: user.id,
          date: { gte: startDate },
          status: "COMPLETED",
          NOT: { category: GOAL_CATEGORY },
        },
      });

      const income = txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
      const expense = txns.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
      const currentSaved = Math.max(0, income - expense);

      const progress = Math.min(100, (currentSaved / goal.targetAmount) * 100);
      const daysLeft = Math.max(0, differenceInDays(targetDate, now));
      const monthsLeft = Math.max(0, differenceInMonths(targetDate, now));
      const remaining = Math.max(0, goal.targetAmount - currentSaved);
      const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
      const onTrack = currentSaved >= (goal.targetAmount * (differenceInDays(now, startDate) / differenceInDays(targetDate, startDate)));

      return {
        ...goal,
        currentSaved: parseFloat(currentSaved.toFixed(2)),
        progress: parseFloat(progress.toFixed(1)),
        daysLeft,
        monthsLeft,
        remaining: parseFloat(remaining.toFixed(2)),
        monthlyNeeded: parseFloat(monthlyNeeded.toFixed(2)),
        onTrack,
        completed: currentSaved >= goal.targetAmount,
      };
    })
  );

  return enriched;
}

export async function createSavingsGoal(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: { userId: user.id },
    orderBy: { isDefault: "desc" },
  });
  if (!account) throw new Error("No account found");

  const goals = await getGoalsRaw(userId, user.id);

  const newGoal = {
    id: crypto.randomUUID(),
    name: formData.name,
    targetAmount: parseFloat(formData.targetAmount),
    targetDate: formData.targetDate,
    startDate: new Date().toISOString(),
    emoji: formData.emoji || "🎯",
    color: formData.color || "#6366f1",
  };

  goals.push(newGoal);
  await saveGoalsRaw(user.id, account.id, goals);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSavingsGoal(goalId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });

  const goals = await getGoalsRaw(userId, user.id);
  const updated = goals.filter((g) => g.id !== goalId);
  await saveGoalsRaw(user.id, account.id, updated);
  revalidatePath("/dashboard");
  return { success: true };
}