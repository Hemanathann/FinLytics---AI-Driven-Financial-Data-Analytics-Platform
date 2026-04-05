"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { subDays, format, startOfMonth } from "date-fns";

// Realistic merchant names per category
const MERCHANTS = {
  salary:        ["Acme Corp Payroll", "Monthly Salary", "Direct Deposit - Employer"],
  freelance:     ["Upwork Payment", "Fiverr Earnings", "Client Invoice #INV-042", "Toptal Payment"],
  investments:   ["Dividend - AAPL", "ETF Distribution", "Robinhood Dividend", "Vanguard Returns"],
  "other-income":["Tax Refund", "Cashback Reward", "Referral Bonus", "eBay Sale"],
  housing:       ["Rent Payment - Apt 4B", "Property Management Co.", "Mortgage Payment"],
  transportation:["Shell Petrol", "Dublin Bus", "Leap Card Top-Up", "Uber", "Parking Fee"],
  groceries:     ["Tesco Express", "Lidl Weekly Shop", "Aldi Groceries", "Dunnes Stores", "Marks & Spencer Food"],
  utilities:     ["Electric Ireland", "Irish Water", "Eir Broadband", "Gas Networks Ireland"],
  entertainment: ["Netflix", "Spotify Premium", "Disney+", "Cinema Ticket", "Steam Games"],
  food:          ["Starbucks", "McDonald's", "Subway", "Deliveroo Order", "Just Eat", "Nando's", "Costa Coffee"],
  shopping:      ["Amazon.ie", "ASOS", "Zara", "Penneys", "H&M", "Harvey Norman"],
  healthcare:    ["Boots Pharmacy", "GP Visit", "Dental Check-up", "Specsavers", "Gym Membership"],
  education:     ["Udemy Course", "Coursera Subscription", "LinkedIn Learning", "College Fee"],
  personal:      ["Barber Shop", "Haircut", "Gym - FLYEfit", "Skincare Products"],
  travel:        ["Ryanair Flight", "Airbnb Stay", "Hotels.com Booking", "Train Tickets"],
  insurance:     ["Aviva Health Insurance", "AXA Car Insurance", "Home Insurance Premium"],
  bills:         ["Phone Bill - Vodafone", "Sky Sports", "Bank Service Fee", "Annual Card Fee"],
  "other-expense":["Misc. Purchase", "ATM Withdrawal", "Cash Payment"],
};

// Realistic amount ranges (€ / $)
const RANGES = {
  salary:        [3800, 5500],
  freelance:     [400, 1200],
  investments:   [80,  600],
  "other-income":[50,  400],
  housing:       [900, 1600],
  transportation:[20,  120],
  groceries:     [40,  180],
  utilities:     [60,  200],
  entertainment: [8,   50],
  food:          [8,   60],
  shopping:      [25,  300],
  healthcare:    [20,  250],
  education:     [15,  300],
  personal:      [15,  80],
  travel:        [150, 800],
  insurance:     [60,  200],
  bills:         [20,  120],
  "other-expense":[10, 80],
};

// Which categories appear monthly (recurring) vs random
const RECURRING_EXPENSE = ["housing", "utilities", "entertainment", "insurance", "bills"];
const FREQUENT_EXPENSE  = ["groceries", "food", "transportation", "personal"];
const OCCASIONAL_EXPENSE = ["shopping", "healthcare", "education", "travel", "other-expense"];

function rand(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function merchant(cat) {
  return MERCHANTS[cat] ? pick(MERCHANTS[cat]) : cat;
}

export async function seedDemoTransactions() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const account = await db.account.findFirst({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });
    if (!account) throw new Error("No account found — please create an account first");

    const transactions = [];
    let balanceDelta = 0;
    const now = new Date();

    // Build 6 months of realistic data
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      const monthBase = subDays(now, monthOffset * 30);

      // ── Monthly salary (1st working day of month) ──────────
      const salaryDate = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1);
      const salaryAmount = rand(...RANGES.salary);
      transactions.push({ type: "INCOME", amount: salaryAmount, category: "salary", description: merchant("salary"), date: salaryDate });
      balanceDelta += salaryAmount;

      // ── Occasional freelance income ─────────────────────────
      if (Math.random() > 0.4) {
        const amount = rand(...RANGES.freelance);
        transactions.push({ type: "INCOME", amount, category: "freelance", description: merchant("freelance"), date: subDays(monthBase, Math.floor(Math.random() * 25)) });
        balanceDelta += amount;
      }

      // ── Recurring monthly expenses ──────────────────────────
      RECURRING_EXPENSE.forEach((cat) => {
        if (cat === "housing" && monthOffset > 0 || cat !== "housing") {
          const amount = rand(...RANGES[cat]);
          const day = cat === "housing" ? 2 : Math.floor(Math.random() * 25) + 1;
          const date = new Date(monthBase.getFullYear(), monthBase.getMonth(), day);
          transactions.push({ type: "EXPENSE", amount, category: cat, description: merchant(cat), date });
          balanceDelta -= amount;
        }
      });
      // Housing every month
      if (true) {
        const amount = rand(...RANGES.housing);
        const date = new Date(monthBase.getFullYear(), monthBase.getMonth(), 2);
        transactions.push({ type: "EXPENSE", amount, category: "housing", description: merchant("housing"), date });
        balanceDelta -= amount;
      }

      // ── Frequent weekly expenses ────────────────────────────
      for (let week = 0; week < 4; week++) {
        const weekDate = subDays(monthBase, week * 7 + Math.floor(Math.random() * 5));
        FREQUENT_EXPENSE.forEach((cat) => {
          if (Math.random() > 0.25) {
            const amount = rand(...RANGES[cat]);
            transactions.push({ type: "EXPENSE", amount, category: cat, description: merchant(cat), date: weekDate });
            balanceDelta -= amount;
          }
        });
      }

      // ── Occasional expenses (1–2 per month per category) ───
      OCCASIONAL_EXPENSE.forEach((cat) => {
        if (Math.random() > 0.5) {
          const amount = rand(...RANGES[cat]);
          const date = subDays(monthBase, Math.floor(Math.random() * 28));
          transactions.push({ type: "EXPENSE", amount, category: cat, description: merchant(cat), date });
          balanceDelta -= amount;
        }
      });
    }

    // Remove duplicates / sort by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Remove housing duplicates (added twice above by mistake)
    const seen = new Set();
    const deduped = transactions.filter((t) => {
      if (t.category === "housing") {
        const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    });

    // Persist to DB
    await db.$transaction(async (tx) => {
      // Clear old demo transactions for this account
      await tx.transaction.deleteMany({ where: { accountId: account.id } });

      await tx.transaction.createMany({
        data: deduped.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: account.id,
          status: "COMPLETED",
          createdAt: t.date,
          updatedAt: t.date,
        })),
      });

      await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: balanceDelta } },
      });
    });

    return { success: true, count: deduped.length };
  } catch (error) {
    console.error("Seed error:", error);
    throw new Error(error.message);
  }
}