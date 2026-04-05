import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();
  // Next.js 15: searchParams must be awaited before accessing properties
  const resolvedParams = await searchParams;
  const editId = resolvedParams?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
}