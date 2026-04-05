"use client";

import { useState } from "react";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, PenBox,
  Trash2, RefreshCw, TrendingUp, TrendingDown,
  BarChart2, Search, Filter, Download, AlertCircle,
  CheckCircle2, Loader2, Check,
} from "lucide-react";
import { bulkDeleteTransactions } from "@/actions/account";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

const CAT_BG = {
  groceries:"bg-emerald-100 text-emerald-700",
  food:"bg-orange-100 text-orange-700",
  entertainment:"bg-purple-100 text-purple-700",
  transportation:"bg-blue-100 text-blue-700",
  utilities:"bg-yellow-100 text-yellow-800",
  salary:"bg-emerald-100 text-emerald-700",
  shopping:"bg-pink-100 text-pink-700",
  healthcare:"bg-red-100 text-red-700",
  housing:"bg-slate-100 text-slate-700",
  bills:"bg-amber-100 text-amber-700",
  insurance:"bg-teal-100 text-teal-700",
};
const catBg = (c) => CAT_BG[c] || "bg-muted text-muted-foreground";

const ALL_CATS = [
  "all","salary","groceries","food","shopping","entertainment",
  "transportation","utilities","housing","healthcare","bills","insurance",
  "other-expense","other-income",
];

export function AccountClient({ account }) {
  const { transactions, name, type, balance, _count } = account;

  const [search,    setSearch]    = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter,setTypeFilter]= useState("all");
  const [selected,  setSelected]  = useState([]);
  const [deleting,  setDeleting]  = useState(false);

  const { fn: deleteFn, loading: deleteLoading } = useFetch(bulkDeleteTransactions);

  // Computed stats
  const income  = transactions.filter(t=>t.type==="INCOME").reduce((s,t)=>s+Number(t.amount),0);
  const expense = transactions.filter(t=>t.type==="EXPENSE").reduce((s,t)=>s+Number(t.amount),0);

  // Filtered list
  const filtered = transactions.filter(t => {
    const desc = (t.description||"").toLowerCase();
    const matchSearch = !search || desc.includes(search.toLowerCase()) || t.category?.includes(search.toLowerCase());
    const matchCat  = catFilter  === "all" || t.category === catFilter;
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchCat && matchType;
  });

  const toggleRow = id => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(t=>t.id));

  const handleDelete = async () => {
    if (!selected.length) return;
    setDeleting(true);
    try {
      await deleteFn(selected);
      toast.success(`${selected.length} transaction${selected.length!==1?"s":""} deleted`);
      setSelected([]);
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const rows = [
      ["Date","Type","Category","Description","Amount"],
      ...filtered.map(t=>[
        format(new Date(t.date),"yyyy-MM-dd"),
        t.type,
        t.category,
        `"${(t.description||"").replace(/"/g,'""')}"`,
        Number(t.amount).toFixed(2),
      ])
    ];
    const csv  = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${name.replace(/\s+/g,"-")}-transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 md:pb-10">

      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6 mb-5 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform"/>
        Back to Dashboard
      </Link>

      {/* Account hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 text-white mb-5">
        <div className="absolute inset-0 opacity-10"
          style={{backgroundImage:"radial-gradient(circle at 85% 50%, white 1px, transparent 1px)",backgroundSize:"20px 20px"}}/>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{type.toLowerCase()} account</p>
              <h1 className="text-2xl font-black">{name}</h1>
            </div>
            <Link href={`/transaction/create?accountId=${account.id}`}>
              <button className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl text-sm font-semibold transition-colors">
                <PenBox className="h-4 w-4"/>Add transaction
              </button>
            </Link>
          </div>
          <p className="text-4xl font-black mb-4">{fmt(Number(balance))}</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {l:"Total income",  v:`+${fmt(income)}`,   c:"text-emerald-400"},
              {l:"Total expenses",v:`-${fmt(expense)}`,   c:"text-red-400"},
              {l:"Transactions",  v:`${_count?.transactions||transactions.length}`, c:"text-slate-200"},
            ].map(s=>(
              <div key={s.l} className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{s.l}</p>
                <p className={cn("text-base font-black",s.c)}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-muted rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>

        {/* Type filter */}
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          className="bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border-0 focus:ring-2 focus:ring-blue-500/20">
          <option value="all">All types</option>
          <option value="INCOME">Income only</option>
          <option value="EXPENSE">Expenses only</option>
        </select>

        {/* Category filter */}
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          className="bg-muted rounded-xl px-3 py-2.5 text-sm outline-none border-0 focus:ring-2 focus:ring-blue-500/20">
          {ALL_CATS.map(c=>(
            <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
          ))}
        </select>

        {/* Export */}
        <button onClick={handleExport}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground border rounded-xl px-3 py-2 hover:bg-muted transition-all">
          <Download className="h-4 w-4"/>Export
        </button>
      </div>

      {/* Bulk delete bar */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 mb-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            {selected.length} transaction{selected.length!==1?"s":""} selected
          </p>
          <div className="flex gap-2">
            <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors">
              Deselect
            </button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
              {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Trash2 className="h-3.5 w-3.5"/>}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* List header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={toggleAll}>
            {selected.length === filtered.length && filtered.length > 0 &&
              <Check className="h-3 w-3 text-blue-600"/>
            }
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{filtered.length} transactions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3"/>
            <p className="text-sm text-muted-foreground">No transactions match your filters</p>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3.5 hover:bg-muted/30 transition-colors group">
                {/* Checkbox */}
                <div onClick={() => toggleRow(t.id)}
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all",
                    selected.includes(t.id) ? "bg-blue-500 border-blue-500" : "border-muted-foreground/30 hover:border-blue-400"
                  )}>
                  {selected.includes(t.id) && <CheckCircle2 className="h-3 w-3 text-white"/>}
                </div>

                {/* Type icon */}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  t.type==="INCOME" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950")}>
                  {t.type==="INCOME"
                    ? <ArrowUpRight className="h-4 w-4 text-emerald-600"/>
                    : <ArrowDownRight className="h-4 w-4 text-red-500"/>
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.description || t.category}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", catBg(t.category))}>
                      {t.category}
                    </span>
                    {t.isRecurring && (
                      <span className="text-[10px] flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                        <RefreshCw className="h-2.5 w-2.5"/>recurring
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.date),"dd MMM yyyy")}</span>
                  </div>
                </div>

                {/* Amount */}
                <p className={cn("font-black text-sm shrink-0", t.type==="INCOME"?"text-emerald-500":"text-red-500")}>
                  {t.type==="INCOME"?"+":"-"}${Number(t.amount).toFixed(2)}
                </p>

                {/* Edit link */}
                <Link href={`/transaction/create?edit=${t.id}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <PenBox className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"/>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}