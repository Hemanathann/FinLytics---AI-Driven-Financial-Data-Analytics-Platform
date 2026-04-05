import { getAccountWithTransactions } from "@/actions/account";
import { notFound } from "next/navigation";
import { AccountClient } from "./_components/account-client";

export default async function AccountPage({ params }) {
  // Next.js 15: params must be awaited before accessing properties
  const { id } = await params;
  const rawAccount = await getAccountWithTransactions(id);
  if (!rawAccount) notFound();

  // Prisma returns Decimal objects which can't be passed to Client Components
  // Serialise balance and all transaction amounts to plain numbers
  const account = {
    ...rawAccount,
    balance: Number(rawAccount.balance),
    transactions: (rawAccount.transactions || []).map(t => ({
      ...t,
      amount: Number(t.amount),
      date:   t.date instanceof Date ? t.date.toISOString() : t.date,
    })),
  };

  return <AccountClient account={account} />;
}