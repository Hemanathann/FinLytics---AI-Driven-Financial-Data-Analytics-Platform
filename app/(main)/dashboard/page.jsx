import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { getSavingsGoals } from "@/actions/savings-goals";
import { detectSubscriptions } from "@/actions/subscriptions";
import { getNetWorthData } from "@/actions/net-worth";
import { getBudgetVsActual } from "@/actions/budget-vs-actual";
import { DashboardClient } from "./_components/dashboard-client";

// Prisma returns Decimal objects which can't be serialised to Client Components.
// This helper recursively converts all Decimal (and Date) values to plain JS types.
function serialise(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(serialise);
  if (typeof obj === "object" && typeof obj.toNumber === "function") return obj.toNumber();
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, serialise(v)]));
  }
  return obj;
}

export default async function DashboardPage() {
  const [accounts, transactions, savingsGoals, subscriptionData, netWorthData, budgetVsActual] =
    await Promise.all([
      getUserAccounts(), getDashboardData(), getSavingsGoals(),
      detectSubscriptions(), getNetWorthData(), getBudgetVsActual(),
    ]);

  const defaultAccount = accounts?.find((a) => a.isDefault);
  const budgetData = defaultAccount ? await getCurrentBudget(defaultAccount.id) : null;

  return (
    <DashboardClient
      accounts={serialise(accounts)}
      transactions={serialise(transactions || [])}
      savingsGoals={serialise(savingsGoals)}
      subscriptionData={serialise(subscriptionData)}
      netWorthData={serialise(netWorthData)}
      budgetVsActual={serialise(budgetVsActual)}
      budgetData={serialise(budgetData)}
    />
  );
}