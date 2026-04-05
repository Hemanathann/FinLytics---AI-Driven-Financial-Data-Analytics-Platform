import { getUserAccounts } from "@/actions/dashboard";
import { StatementImporter } from "./_components/statement-importer";

export default async function StatementImportPage() {
  const accounts = await getUserAccounts();

  return (
    <div className="max-w-4xl mx-auto px-5">
      <div className="mb-8">
        <h1 className="text-5xl gradient-title">Import Statement</h1>
        <p className="text-muted-foreground mt-2">
          Upload your bank statement (PDF or CSV) and AI will extract all
          transactions automatically
        </p>
      </div>
      <StatementImporter accounts={accounts} />
    </div>
  );
}
