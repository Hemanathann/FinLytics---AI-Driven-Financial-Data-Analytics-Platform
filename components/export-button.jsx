"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileText, FileSpreadsheet } from "lucide-react";
import { exportTransactionsCSV } from "@/actions/export";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ExportButton({ className }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const downloadCSV = async () => {
    setLoading(true);
    setOpen(false);
    try {
      const { csv, filename } = await exportTransactionsCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Transactions exported as CSV");
    } catch (e) {
      toast.error("Export failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const printPDF = () => {
    setOpen(false);
    window.print();
    toast.success("Print dialog opened — save as PDF");
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Export
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-background border rounded-xl shadow-lg overflow-hidden min-w-[180px]">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors text-left"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <div>
                <p className="font-medium">Export CSV</p>
                <p className="text-xs text-muted-foreground">Download transaction data</p>
              </div>
            </button>
            <button
              onClick={printPDF}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-t"
            >
              <FileText className="h-4 w-4 text-red-500" />
              <div>
                <p className="font-medium">Save as PDF</p>
                <p className="text-xs text-muted-foreground">Print this page as PDF</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
