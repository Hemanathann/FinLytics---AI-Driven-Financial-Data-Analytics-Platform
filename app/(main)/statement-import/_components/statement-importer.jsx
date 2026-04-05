"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  FileSpreadsheet, Upload, CheckCircle2, ArrowRight, Loader2,
  Trash2, ChevronDown, ChevronUp, Info, LayoutGrid, List,
  ArrowUpRight, ArrowDownRight, Search, Building2, Globe,
  Sparkles, AlertCircle, Edit2, Check, X, ChevronRight,
  PieChart, BarChart2, SkipForward, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { parseStatement, bulkImportTransactions } from "@/actions/statement-parser";

// ── Constants ─────────────────────────────────────────────────
const BANKS = [
  { name:"AIB",              flag:"🇮🇪", tip:"Accounts → Transactions → Download Statement → CSV" },
  { name:"Bank of Ireland",  flag:"🇮🇪", tip:"365 Online → My Accounts → Statement → Export CSV" },
  { name:"Revolut",          flag:"🌍", tip:"App → Account → Statement → Download CSV" },
  { name:"HDFC Bank",        flag:"🇮🇳", tip:"NetBanking → Accounts → Download Statement → CSV" },
  { name:"SBI",              flag:"🇮🇳", tip:"OnlineSBI → Account Statement → Download CSV" },
  { name:"Chase / BofA",     flag:"🇺🇸", tip:"Account → Download → Select date range → CSV" },
];

const ALL_CATEGORIES = [
  "salary","freelance","investments","business","rental","other-income",
  "housing","transportation","groceries","utilities","entertainment",
  "food","shopping","healthcare","education","personal","travel",
  "insurance","gifts","bills","currency-exchange","other-expense",
];

const CAT_COLORS_HEX = {
  salary:"#1D9E75", freelance:"#5DCAA5", investments:"#378ADD",
  business:"#7F77DD", rental:"#EF9F27", "other-income":"#639922",
  housing:"#E24B4A", transportation:"#185FA5", groceries:"#1D9E75",
  utilities:"#BA7517", entertainment:"#534AB7", food:"#f97316",
  shopping:"#D4537E", healthcare:"#E24B4A", education:"#378ADD",
  personal:"#888780", travel:"#5DCAA5", insurance:"#0F6E56",
  gifts:"#ED93B1", bills:"#EF9F27", "currency-exchange":"#FA243C",
  "other-expense":"#B4B2A9",
};

const CONFIDENCE_STYLES = {
  high:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  low:    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const CAT_BG = {
  groceries:"bg-emerald-100 text-emerald-700",food:"bg-orange-100 text-orange-700",
  entertainment:"bg-purple-100 text-purple-700",transportation:"bg-blue-100 text-blue-700",
  utilities:"bg-yellow-100 text-yellow-800",salary:"bg-emerald-100 text-emerald-700",
  shopping:"bg-pink-100 text-pink-700",healthcare:"bg-red-100 text-red-700",
  housing:"bg-slate-100 text-slate-700",bills:"bg-amber-100 text-amber-700",
  insurance:"bg-teal-100 text-teal-700",education:"bg-indigo-100 text-indigo-700",
  travel:"bg-cyan-100 text-cyan-700","currency-exchange":"bg-red-100 text-red-700",
};
const catBg = (c) => CAT_BG[c] || "bg-muted text-muted-foreground";

// ── Category override dropdown ─────────────────────────────────
function CategoryPicker({ current, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium capitalize transition-all hover:opacity-80 border border-transparent hover:border-current",
          catBg(current)
        )}
      >
        {current}
        <Edit2 className="h-2.5 w-2.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
          style={{ width: 180, maxHeight: 220, overflowY: "auto" }}>
          {ALL_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { onChange(cat); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs capitalize hover:bg-muted transition-colors flex items-center justify-between",
                cat === current && "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold"
              )}>
              {cat}
              {cat === current && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary pie chart (SVG) ────────────────────────────────────
function SummaryPie({ breakdown }) {
  const entries = Object.entries(breakdown).sort(([,a],[,b]) => b - a).slice(0, 8);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return null;

  let cumAngle = -90;
  const cx = 80, cy = 80, r = 65;

  const slices = entries.map(([cat, count]) => {
    const pct   = count / total;
    const angle = pct * 360;
    const startA = cumAngle * (Math.PI / 180);
    cumAngle += angle;
    const endA  = cumAngle * (Math.PI / 180);
    const large = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
    return { cat, count, pct, path };
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {slices.map(({ cat, path }) => (
          <path key={cat} d={path} fill={CAT_COLORS_HEX[cat] || "#888"} stroke="white" strokeWidth="2"/>
        ))}
        <circle cx="80" cy="80" r="32" fill="white" className="dark:fill-slate-900"/>
        <text x="80" y="76" textAnchor="middle" fontSize="11" fontWeight="600" className="fill-slate-700 dark:fill-slate-300">
          {total}
        </text>
        <text x="80" y="89" textAnchor="middle" fontSize="9" className="fill-slate-400">
          transactions
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-[160px]">
        {slices.map(({ cat, count, pct }) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CAT_COLORS_HEX[cat] || "#888" }}/>
            <span className="text-xs text-slate-600 dark:text-slate-400 capitalize truncate flex-1">{cat}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">{count}</span>
            <span className="text-[10px] text-slate-400 w-8 text-right">{(pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function StatementImporter({ accounts }) {
  const router  = useRouter();
  const fileRef = useRef(null);

  const [step,         setStep]         = useState("upload");
  const [file,         setFile]         = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [selected,     setSelected]     = useState([]);
  const [accountId,    setAccountId]    = useState(accounts[0]?.id || "");
  const [parsing,      setParsing]      = useState(false);
  const [importing,    setImporting]    = useState(false);
  const [viewMode,     setViewMode]     = useState("list");
  const [showBanks,    setShowBanks]    = useState(false);
  const [search,       setSearch]       = useState("");
  const [importResult, setImportResult] = useState(null);

  // Custom category overrides — stored in state, applied on next import
  // Format: { [descriptionKey]: categoryString }
  const [customRules, setCustomRules] = useState(() => {
    try { return JSON.parse(localStorage.getItem("finlytics_cat_rules") || "{}"); }
    catch { return {}; }
  });

  const saveCustomRule = useCallback((description, category) => {
    const key = description.toLowerCase().slice(0, 40);
    const updated = { ...customRules, [key]: category };
    setCustomRules(updated);
    try { localStorage.setItem("finlytics_cat_rules", JSON.stringify(updated)); }
    catch {}
  }, [customRules]);

  // Apply custom rules to a transactions list
  const applyCustomRules = useCallback((txns, rules) => {
    return txns.map(t => {
      const key = t.description.toLowerCase().slice(0, 40);
      const override = rules[key];
      return override ? { ...t, category: override, confidence: "high" } : t;
    });
  }, []);

  const onFile = (f) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    if (!f.name.toLowerCase().endsWith(".csv")) { toast.error("Please upload a .csv file"); return; }
    setFile(f);
  };

  const handleParse = async () => {
    if (!file || !accountId) { toast.error("Select an account first"); return; }
    setParsing(true);
    try {
      const csvText = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = e => res(e.target.result);
        r.onerror = () => rej(new Error("Could not read file"));
        r.readAsText(file, "utf-8");
      });
      let result = await parseStatement(csvText);
      if (!result?.length) { toast.error("No transactions found. Check your CSV format."); return; }
      // Apply any saved custom rules
      result = applyCustomRules(result, customRules);
      setTransactions(result);
      setSelected(result.map((_, i) => i));
      setStep("review");
      toast.success(`Found ${result.length} transactions`);
    } catch (err) {
      toast.error(err.message || "Failed to parse");
    } finally {
      setParsing(false);
    }
  };

  const handleCategoryChange = (index, newCategory) => {
    const t = transactions[index];
    // Save as a custom rule for future imports
    saveCustomRule(t.description, newCategory);
    // Update current transaction list
    setTransactions(prev => prev.map((tx, i) =>
      i === index ? { ...tx, category: newCategory, confidence: "high" } : tx
    ));
    toast.success(`Category updated · Rule saved for future imports`);
  };

  const handleImport = async () => {
    if (!accountId || selected.length === 0) return;
    setImporting(true);
    try {
      const toImport = selected.map(i => transactions[i]);
      const result = await bulkImportTransactions(toImport, accountId);
      if (result?.success) {
        setImportResult(result);
        setStep("done");
        if (result.alreadyImported) {
          toast.info("All transactions already imported — no duplicates added");
        } else {
          toast.success(`${result.count} transactions imported!`);
        }
      }
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleRow  = i => setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  const toggleAll  = () => setSelected(selected.length === transactions.length ? [] : transactions.map((_,i) => i));
  const reset      = () => { setStep("upload"); setFile(null); setTransactions([]); setSelected([]); setSearch(""); setImportResult(null); };

  const visible = transactions
    .map((t, i) => ({ t, i }))
    .filter(({ t }) =>
      !search ||
      (t.cleanName || t.description || "").toLowerCase().includes(search.toLowerCase()) ||
      t.category?.includes(search.toLowerCase())
    );

  const sel     = selected.map(i => transactions[i]);
  const income  = sel.filter(t => t.type === "INCOME").reduce((s,t) => s + t.amount, 0);
  const expense = sel.filter(t => t.type === "EXPENSE").reduce((s,t) => s + t.amount, 0);
  const lowConf = transactions.filter(t => t.confidence === "low").length;

  // ── UPLOAD ────────────────────────────────────────────────────
  if (step === "upload") return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:"radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize:"24px 24px" }}/>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5"/>
            </div>
            <div>
              <h1 className="text-xl font-black">Import Bank Statement</h1>
              <p className="text-blue-200 text-sm">Any bank · Auto-categorised · Duplicates skipped</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-blue-100 flex-wrap">
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5"/>Ireland · India · UK · US</span>
            <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5"/>1,145+ merchants auto-detected</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5"/>Duplicate-safe import</span>
          </div>
        </div>
      </div>

      {/* Account picker */}
      <div className="p-5 rounded-2xl border bg-card">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Import into account</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map(a => (
            <button key={a.id} onClick={() => setAccountId(a.id)}
              className={cn("flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-all",
                accountId === a.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}>
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0"/>
                <span>{a.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">${Number(a.balance).toFixed(0)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div className="p-5 rounded-2xl border bg-card">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upload CSV</p>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all group",
            file
              ? "border-green-400 bg-green-50/50 dark:bg-green-950/20"
              : "border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-950/10"
          )}>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => onFile(e.target.files?.[0])}/>
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-14 w-14 text-green-500"/>
              <div><p className="font-bold text-green-700 dark:text-green-300">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{(file.size/1024).toFixed(1)} KB</p></div>
              <button onClick={e => { e.stopPropagation(); setFile(null); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5"/>Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-950 transition-colors flex items-center justify-center">
                <Upload className="h-7 w-7 text-muted-foreground group-hover:text-blue-500 transition-colors"/>
              </div>
              <div><p className="font-semibold">Drop your CSV here</p>
                <p className="text-sm text-muted-foreground mt-0.5">or click to browse</p></div>
              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">.csv only · up to 10 MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Custom rules notice */}
      {Object.keys(customRules).length > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0"/>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>{Object.keys(customRules).length} custom category rules</strong> saved — will apply automatically to this import.
          </p>
          <button onClick={() => { setCustomRules({}); localStorage.removeItem("finlytics_cat_rules"); }}
            className="ml-auto text-[10px] text-blue-500 hover:text-blue-700 font-medium">Clear rules</button>
        </div>
      )}

      {/* Bank guide */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <button onClick={() => setShowBanks(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors">
          <span className="flex items-center gap-2"><Info className="h-4 w-4"/>How to export CSV from your bank</span>
          {showBanks ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
        </button>
        {showBanks && (
          <div className="border-t divide-y">
            {BANKS.map(b => (
              <div key={b.name} className="flex gap-3 px-5 py-3">
                <span className="text-lg shrink-0">{b.flag}</span>
                <div><p className="text-sm font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.tip}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleParse} disabled={!file || parsing || !accountId}
        className="w-full h-13 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2">
        {parsing
          ? <><Loader2 className="h-5 w-5 animate-spin"/>Parsing statement...</>
          : <><Sparkles className="h-5 w-5"/>Parse & Auto-categorise<ArrowRight className="h-5 w-5"/></>
        }
      </Button>
    </div>
  );

  // ── REVIEW ────────────────────────────────────────────────────
  if (step === "review") return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Selected",     value:`${selected.length} / ${transactions.length}`, color:"text-foreground" },
          { label:"Income",       value:`+$${income.toFixed(2)}`,  color:"text-emerald-500" },
          { label:"Expenses",     value:`-$${expense.toFixed(2)}`, color:"text-red-500" },
          { label:"Low confidence",value:lowConf.toString(), color:lowConf>0?"text-amber-500":"text-emerald-500" },
        ].map(s => (
          <div key={s.label} className="p-3.5 rounded-2xl border bg-card text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
            <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Low confidence notice */}
      {lowConf > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {lowConf} transactions have low-confidence categories
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Click the category badge on any row to correct it. Your correction is saved as a rule and applied automatically on future imports.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter transactions..."
            className="w-full bg-muted rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"/>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll} className="rounded-xl">
          {selected.length === transactions.length ? "Deselect all" : "Select all"}
        </Button>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {[["list", List], ["grid", LayoutGrid]].map(([mode, Icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={cn("p-2 rounded-lg transition-colors", viewMode===mode?"bg-background shadow-sm":"hover:bg-muted/80")}>
              <Icon className="h-4 w-4"/>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {viewMode === "list" ? (
          <div className="divide-y max-h-[520px] overflow-y-auto">
            {visible.map(({ t, i }) => (
              <div key={i}
                onClick={() => toggleRow(i)}
                className={cn(
                  "flex items-center gap-3 p-3.5 cursor-pointer hover:bg-muted/30 transition-colors group",
                  !selected.includes(i) && "opacity-40"
                )}>
                {/* Checkbox */}
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                  selected.includes(i) ? "bg-blue-500 border-blue-500" : "border-muted-foreground/40 group-hover:border-blue-400"
                )}>
                  {selected.includes(i) && <Check className="h-3 w-3 text-white"/>}
                </div>

                {/* Type icon */}
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                  t.type === "INCOME" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"
                )}>
                  {t.type === "INCOME"
                    ? <ArrowUpRight className="h-4 w-4 text-emerald-600"/>
                    : <ArrowDownRight className="h-4 w-4 text-red-500"/>
                  }
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {/* Clean name (merchant normalised) */}
                  <p className="text-sm font-semibold truncate">{t.cleanName || t.description}</p>
                  {/* Raw description if different */}
                  {t.cleanName && t.cleanName !== t.description && (
                    <p className="text-[10px] text-muted-foreground/60 truncate font-mono">{t.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap" onClick={e => e.stopPropagation()}>
                    {/* Clickable category badge */}
                    <CategoryPicker
                      current={t.category}
                      onChange={newCat => handleCategoryChange(i, newCat)}
                    />
                    {/* Confidence badge */}
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", CONFIDENCE_STYLES[t.confidence])}>
                      {t.confidence} confidence
                    </span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.date), "dd MMM yyyy")}</span>
                  </div>
                </div>

                {/* Amount */}
                <p className={cn("font-black text-sm shrink-0", t.type === "INCOME" ? "text-emerald-500" : "text-red-500")}>
                  {t.type === "INCOME" ? "+" : "-"}${t.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 max-h-[520px] overflow-y-auto">
            {visible.map(({ t, i }) => (
              <button key={i} onClick={() => toggleRow(i)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  selected.includes(i) ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30" : "border-transparent bg-muted/50 hover:bg-muted opacity-60"
                )}>
                <p className="text-xs font-semibold truncate">{t.cleanName || t.description}</p>
                <p className={cn("text-lg font-black mt-1", t.type === "INCOME" ? "text-emerald-500" : "text-red-500")}>
                  {t.type === "INCOME" ? "+" : "-"}${t.amount.toFixed(2)}
                </p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize mt-1 inline-block", catBg(t.category))}>
                  {t.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={reset} className="rounded-2xl">← Start over</Button>
        <Button onClick={handleImport} disabled={selected.length === 0 || importing}
          className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
          {importing
            ? <><Loader2 className="h-4 w-4 animate-spin"/>Importing...</>
            : <>Import {selected.length} transaction{selected.length !== 1 ? "s" : ""}<ArrowRight className="h-4 w-4"/></>
          }
        </Button>
      </div>
    </div>
  );

  // ── DONE — Summary report ──────────────────────────────────────
  const r = importResult;
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-5">

      {/* Success header */}
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-500"/>
        </div>
        <h2 className="text-2xl font-black">Import Complete</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {r?.alreadyImported
            ? "All transactions were already in FinLytics — nothing duplicated."
            : `${r?.count} transactions added to your account.`
          }
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon:CheckCircle2, label:"Imported",   value:r?.count || 0,        color:"text-emerald-600", bg:"bg-emerald-50 dark:bg-emerald-950/50" },
          { icon:SkipForward,  label:"Duplicates skipped", value:r?.skipped || 0, color:"text-blue-600 dark:text-blue-400",   bg:"bg-blue-50 dark:bg-blue-950/50" },
          { icon:AlertCircle,  label:"Low confidence", value:r?.lowConfidence || 0, color:r?.lowConfidence?"text-amber-600":"text-emerald-600", bg:r?.lowConfidence?"bg-amber-50 dark:bg-amber-950/50":"bg-emerald-50 dark:bg-emerald-950/50" },
        ].map(s => (
          <div key={s.label} className={cn("p-4 rounded-2xl border text-center", s.bg)}>
            <s.icon className={cn("h-5 w-5 mx-auto mb-2", s.color)}/>
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Financial summary */}
      <div className="p-5 rounded-2xl border bg-card">
        <p className="text-sm font-bold mb-3">What was imported</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Income imported</p>
            <p className="text-xl font-black text-emerald-600">+${r?.income?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Expenses imported</p>
            <p className="text-xl font-black text-red-500">-${r?.expense?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </div>

      {/* Category breakdown pie */}
      {r?.categoryBreakdown && Object.keys(r.categoryBreakdown).length > 0 && (
        <div className="p-5 rounded-2xl border bg-card">
          <p className="text-sm font-bold mb-4">Transactions by category</p>
          <SummaryPie breakdown={r.categoryBreakdown}/>
        </div>
      )}

      {/* Low confidence notice */}
      {r?.lowConfidence > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {r.lowConfidence} transactions may be miscategorised
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Go to the Transactions tab and click any category badge to correct it. Your correction is saved as a rule — it applies automatically the next time you import.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/analytics")} className="flex-1 rounded-2xl">
          <BarChart2 className="h-4 w-4 mr-2"/>View Analytics
        </Button>
        <Button onClick={() => router.push("/dashboard")} className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white">
          Go to Dashboard<ArrowRight className="h-4 w-4 ml-2"/>
        </Button>
      </div>
      <button onClick={reset} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
        Import another file →
      </button>
    </div>
  );
}