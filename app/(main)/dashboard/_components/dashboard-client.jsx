"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MonthlyBillsTracker, TravelTracker } from "./bills-and-travel-tracker";
import { PaydayTracker, BillSplitCalculator, LoanTracker } from "./financial-tools";
import { exportTransactionsCSV } from "@/actions/export";
import { trackCSVExported, trackGoalCreated, trackBudgetSet, trackDashboardTabViewed } from "@/lib/analytics-events";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import { DashboardSpendingCharts } from "./dashboard-spending-charts";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowUpRight, ArrowDownRight, Plus, Wallet, TrendingUp,
  Target, Repeat2, ChevronRight, BarChart2, PenBox,
  ArrowLeftRight, CheckCircle2, Zap, Trash2, RefreshCw,
  Eye, EyeOff, Star, Shield, AlertCircle, Edit2, X,
  Globe, Settings, Check, CreditCard, Landmark, Building,
  Tv, Music, Cloud, Play, ShieldCheck, ChevronDown, Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { updateDefaultAccount, deleteAccount } from "@/actions/account";
import { updateBudget } from "@/actions/budget";
import { createSavingsGoal, deleteSavingsGoal } from "@/actions/savings-goals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const OnboardingChecklist = dynamic(
  () => import("./dashboard-widgets-new").then((m) => m.OnboardingChecklist),
  { ssr: false }
);

const SpendingAlerts = dynamic(
  () => import("./dashboard-widgets-new").then((m) => m.SpendingAlerts),
  { ssr: false }
);

const NetWorthTimeline = dynamic(
  () => import("./dashboard-widgets-new").then((m) => m.NetWorthTimeline),
  { ssr: false }
);

// Strip currency prefix from display name e.g. "[EUR] My Account" → "My Account"
function getCleanName(accountName) {
  return (accountName || "").replace(/^\[[A-Z]{3}]\s*/, "");
}

// Account currency — simplified: all accounts use global currency
function getAccountCurrency(accountName) {
  const match = (accountName || "").match(/^\[([A-Z]{3})\]/);
  return match ? match[1] : null; // null = use global currency
}

// ── Known streaming / subscription services ────────────────────
const KNOWN_SUBS = [
  { key: "netflix", name: "Netflix", icon: "🎬", color: "#E50914" },
  { key: "hotstar", name: "Disney+ Hotstar", icon: "🌟", color: "#0097D6" },
  { key: "spotify", name: "Spotify", icon: "🎵", color: "#1DB954" },
  { key: "youtube", name: "YouTube Premium", icon: "▶️", color: "#FF0000" },
  { key: "prime", name: "Amazon Prime", icon: "📦", color: "#00A8E1" },
  { key: "apple music", name: "Apple Music", icon: "🎶", color: "#FA243C" },
  { key: "apple icloud", name: "Apple iCloud", icon: "☁️", color: "#147EFB" },
  { key: "apple tv", name: "Apple TV+", icon: "🍎", color: "#000000" },
  { key: "sun nxt", name: "Sun NXT", icon: "☀️", color: "#FF6600" },
  { key: "sony liv", name: "Sony LIV", icon: "📺", color: "#0057A8" },
  { key: "zee5", name: "ZEE5", icon: "🎭", color: "#8B008B" },
  { key: "jio cinema", name: "JioCinema", icon: "🎪", color: "#004990" },
  { key: "voot", name: "Voot", icon: "📱", color: "#E84118" },
  { key: "crunchyroll", name: "Crunchyroll", icon: "🍥", color: "#F78022" },
  { key: "hbo", name: "HBO Max", icon: "🎭", color: "#00009A" },
  { key: "disney plus", name: "Disney+", icon: "✨", color: "#113CCF" },
  { key: "dazn", name: "DAZN", icon: "⚽", color: "#F5A623" },
  { key: "notion", name: "Notion", icon: "📝", color: "#000000" },
  { key: "dropbox", name: "Dropbox", icon: "📁", color: "#0061FF" },
  { key: "adobe", name: "Adobe CC", icon: "🎨", color: "#FF0000" },
  { key: "figma", name: "Figma", icon: "🎯", color: "#F24E1E" },
  { key: "github", name: "GitHub", icon: "💻", color: "#181717" },
  { key: "slack", name: "Slack", icon: "💬", color: "#4A154B" },
  { key: "zoom", name: "Zoom", icon: "🎥", color: "#2D8CFF" },
  { key: "canva", name: "Canva", icon: "🖌️", color: "#00C4CC" },
  { key: "linkedin", name: "LinkedIn Premium", icon: "💼", color: "#0077B5" },
  { key: "microsoft 365", name: "Microsoft 365", icon: "🪟", color: "#D83B01" },
  { key: "google one", name: "Google One", icon: "🔵", color: "#4285F4" },
  { key: "anthropic", name: "Anthropic Claude", icon: "🤖", color: "#CC785C" },
  { key: "lycamobile", name: "LycaMobile", icon: "📱", color: "#E4002B" },
  { key: "apple", name: "Apple", icon: "🍎", color: "#555555" },
  { key: "setanta", name: "Setanta Sports", icon: "⚽", color: "#003082" },
  { key: "paramount", name: "Paramount+", icon: "⭐", color: "#0064FF" },
  { key: "apple arcade", name: "Apple Arcade", icon: "🎮", color: "#147EFB" },
  { key: "duolingo", name: "Duolingo", icon: "🦉", color: "#58CC02" },
  { key: "chatgpt", name: "ChatGPT Plus", icon: "🧠", color: "#74AA9C" },
  { key: "cursor", name: "Cursor AI", icon: "💻", color: "#000000" },
  { key: "windsurf", name: "Windsurf AI", icon: "🏄", color: "#4F46E5" },
  { key: "jupiter ventures", name: "Jupiter Ventures", icon: "🏠", color: "#ef4444" },
];

// ── Insurance providers ────────────────────────────────────────
const INSURANCE_KEYWORDS = [
  "aviva", "axa", "allianz", "zurich", "laya", "vhi", "irish life", "new ireland", "fbd",
  "legal general", "standard life", "royal london", "aviva uk", "bupa", "saga insurance",
  "lic", "hdfc life", "icici prudential", "sbi life", "bajaj allianz", "max life",
  "tata aia", "star health", "care health", "niva bupa", "reliance general",
  "new india assurance", "national insurance", "oriental insurance",
  "state farm", "allstate", "geico", "progressive", "liberty mutual", "metlife",
  "principal", "northwestern mutual", "john hancock", "prudential",
  "insurance", "assurance", "protection",
];

// ── Helpers ────────────────────────────────────────────────────
const GOAL_EMOJIS = ["🎯", "🏠", "✈️", "🚗", "💻", "📚", "💍", "🎓", "🏖️", "💪", "🏋️", "🎸", "🎮", "📷"];
const ACCOUNT_ICONS = { CURRENT: Landmark, SAVINGS: Wallet, CREDIT: CreditCard, INVESTMENT: TrendingUp };
const CAT_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#06b6d4"];

function SectionHead({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {action}
    </div>
  );
}

export function DashboardClient({ accounts, transactions, savingsGoals, subscriptionData, netWorthData, budgetVsActual, budgetData }) {
  const currency = "EUR";
  const sym = "€";

  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [budgetEdit, setBudgetEdit] = useState(false);
  const [budgetVal, setBudgetVal] = useState(budgetData?.budget?.amount?.toString() || "");
  const [goalForm, setGoalForm] = useState(false);
  const [goalData, setGoalData] = useState({ name: "", targetAmount: "", targetDate: "", emoji: "🎯" });
  const [manualSub, setManualSub] = useState(false);
  const [manualIns, setManualIns] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", amount: "", frequency: "monthly" });
  const [insurances, setInsurances] = useState([]);
  const [newIns, setNewIns] = useState({ name: "", provider: "", premium: "", frequency: "monthly", startDate: "", endDate: "", type: "Life" });
  const [deletingId, setDeletingId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const result = await exportTransactionsCSV();
      if (result?.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
        trackCSVExported();
      }
    } catch (err) {
      toast.error("Export failed: " + (err.message || "Please try again"));
    } finally {
      setExportLoading(false);
    }
  };

  const { fn: updateDefaultFn, loading: defaultLoading } = useFetch(updateDefaultAccount);
  const { fn: deleteAccountFn, loading: deleteLoading } = useFetch(deleteAccount);
  const { fn: updateBudgetFn, loading: budgetLoading } = useFetch(updateBudget);
  const { fn: createGoalFn, loading: goalLoading } = useFetch(createSavingsGoal);
  const { fn: deleteGoalFn } = useFetch(deleteSavingsGoal);

  // ── Computed ───────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const now = new Date();
  const monthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTxns.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const monthExpense = monthTxns.filter(t => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const recentTxns = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  const recurringTxns = transactions.filter(t => t.isRecurring);
  const pctUsed = budgetData?.budget ? Math.min(100, (budgetData.currentExpenses / budgetData.budget.amount) * 100) : 0;
  const sparkData = netWorthData?.chartData?.map(m => ({ v: m.netWorth || 0 })) || [];

  // ── Auto-detect subscriptions from transactions ────────────
  const detectedSubs = KNOWN_SUBS.map(sub => {
    const matches = transactions.filter(t => {
      const desc = (t.description || "").toLowerCase();
      return desc.includes(sub.key) && t.type === "EXPENSE";
    });
    if (matches.length === 0) return null;
    const latest = matches.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const avgAmount = matches.reduce((s, m) => s + Number(m.amount), 0) / matches.length;
    return { ...sub, amount: parseFloat(avgAmount.toFixed(2)), lastDate: latest.date, occurrences: matches.length };
  }).filter(Boolean);

  // ── Auto-detect insurances from transactions ────────────────
  const detectedInsurances = transactions.filter(t => {
    const d = (t.description || "").toLowerCase();
    return INSURANCE_KEYWORDS.some(k => d.includes(k)) && t.type === "EXPENSE";
  }).reduce((acc, t) => {
    const key = (t.description || "").toLowerCase().split(" ").slice(0, 2).join("-");
    if (!acc[key]) acc[key] = { name: t.description, amount: Number(t.amount), lastDate: t.date, count: 0 };
    acc[key].count++;
    return acc;
  }, {});

  const handleDefaultChange = async (acc) => {
    if (acc.isDefault) { toast.warning("Set another account as default first"); return; }
    const result = await updateDefaultFn(acc.id);
    if (result?.success !== false) {
      toast.success(`${acc.name} is now your default account`);
      window.location.reload();
    } else {
      toast.error(result?.error || "Failed to update");
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (acc.isDefault) { toast.error("Cannot delete default account. Set another as default first."); return; }
    setDeletingId(acc.id);
    const result = await deleteAccountFn(acc.id);
    if (result?.success !== false) {
      toast.success(`${acc.name} deleted`);
      window.location.reload();
    } else {
      toast.error(result?.error || "Failed to delete account");
    }
    setDeletingId(null);
  };

  const handleBudgetSave = async () => {
    const amt = parseFloat(budgetVal);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    await updateBudgetFn(amt);
    trackBudgetSet({ amount: amt });
    setBudgetEdit(false);
    toast.success("Budget updated");
  };

  const handleGoalCreate = async () => {
    if (!goalData.name || !goalData.targetAmount || !goalData.targetDate) { toast.error("Fill all fields"); return; }
    await createGoalFn(goalData);
    setGoalForm(false);
    trackGoalCreated({ targetAmount: parseFloat(goalData.targetAmount) || 0, emoji: goalData.emoji });
    setGoalData({ name: "", targetAmount: "", targetDate: "", emoji: "🎯" });
    toast.success("Goal created!");
    window.location.reload();
  };

  const handleAddInsurance = () => {
    if (!newIns.name || !newIns.premium) { toast.error("Fill name and premium"); return; }
    setInsurances(prev => [...prev, { ...newIns, id: Date.now() }]);
    setNewIns({ name: "", provider: "", premium: "", frequency: "monthly", startDate: "", endDate: "", type: "Life" });
    setManualIns(false);
    toast.success("Insurance added");
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "transactions", label: "Transactions" },
    { id: "bills", label: "Bills" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "travel", label: "Travel" },
    { id: "insurance", label: "Insurance" },
    { id: "goals", label: "Goals" },
    { id: "payday", label: "Payday" },
    { id: "split", label: "Split Bill" },
    { id: "loans", label: "Loans & EMI" },
  ];

  return (
    <div className="pb-20 max-w-5xl mx-auto space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 text-white">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 50%),radial-gradient(circle at 80% 20%, rgba(59,130,246,0.15) 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Total Balance</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-3xl sm:text-4xl font-black tracking-tight">
                    {showBalance ? fmt(totalBalance) : "••••••••"}
                  </p>
                  <button onClick={() => setShowBalance(v => !v)} className="text-slate-400 hover:text-white transition-colors">
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/transaction/create">
                <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl px-3 py-2 text-sm font-semibold transition-colors">
                  <Plus className="h-4 w-4" />Add
                </button>
              </Link>
              <Link href="/statement-import">
                <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 text-sm font-medium transition-colors">
                  <ArrowLeftRight className="h-4 w-4" />Import
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "This month income", value: fmt(monthIncome), color: "text-emerald-400" },
              { label: "This month spent", value: fmt(monthExpense), color: "text-rose-400" },
              { label: "Net this month", value: fmt(monthIncome - monthExpense), color: (monthIncome - monthExpense) >= 0 ? "text-emerald-400" : "text-rose-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                <p className={cn("text-base font-bold mt-0.5 truncate", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Net Worth", value: fmt(netWorthData?.currentNetWorth || 0), sub: "across all accounts", icon: TrendingUp, bg: "from-blue-500 to-blue-600" },
          { label: "Monthly Budget", value: budgetData?.budget ? fmt(budgetData.budget.amount) : "Not set", sub: budgetData?.budget ? `${pctUsed.toFixed(0)}% used` : "Tap to set", icon: Target, bg: "from-violet-500 to-purple-600" },
          { label: "Subscriptions", value: fmt((subscriptionData?.totalMonthly || detectedSubs.reduce((s, d) => s + (d.amount || 0), 0))) + "/mo", sub: `${detectedSubs.length} detected`, icon: Repeat2, bg: "from-amber-500 to-orange-500" },
          { label: "This Month", value: fmt(monthExpense), sub: monthIncome > 0 ? `${((monthExpense / monthIncome) * 100).toFixed(0)}% of income` : "spent", icon: BarChart2, bg: monthExpense > monthIncome ? "from-red-500 to-rose-600" : "from-emerald-500 to-green-600" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl border bg-card">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 bg-gradient-to-br text-white", s.bg)}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-lg font-black mt-0.5 truncate">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold">Monthly Budget</span>
            {budgetData?.budget && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                pctUsed >= 90 ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                pctUsed >= 75 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              )}>
                {pctUsed.toFixed(0)}% used
              </span>
            )}
          </div>
          <button onClick={() => setBudgetEdit(v => !v)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {budgetEdit ? "Cancel" : "Edit"}
          </button>
        </div>
        {budgetEdit ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{sym}</span>
              <input
                value={budgetVal}
                onChange={e => setBudgetVal(e.target.value)}
                type="number"
                placeholder="Monthly budget"
                className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-xl outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>
            <Button size="sm" onClick={handleBudgetSave} disabled={budgetLoading} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              {budgetLoading ? "…" : "Save"}
            </Button>
          </div>
        ) : budgetData?.budget ? (
          <>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Spent: <strong className="text-foreground">{fmt(budgetData.currentExpenses || 0)}</strong></span>
              <span>Budget: <strong className="text-foreground">{fmt(budgetData.budget.amount)}</strong></span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctUsed}%`, background: pctUsed >= 90 ? "#ef4444" : pctUsed >= 75 ? "#f59e0b" : "#22c55e" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {fmt(Math.max(0, (budgetData.budget.amount || 0) - (budgetData.currentExpenses || 0)))} remaining this month
            </p>
          </>
        ) : (
          <button
            onClick={() => setBudgetEdit(true)}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground border border-dashed rounded-xl transition-colors"
          >
            Set a monthly budget →
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-2xl overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 text-xs sm:text-sm py-2 px-2 sm:px-3 rounded-xl font-medium transition-all whitespace-nowrap",
              activeTab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <OnboardingChecklist
            hasAccounts={accounts.length > 0}
            hasTransactions={transactions.length > 0}
            hasBudget={!!(budgetData?.budget?.amount)}
            hasGoals={!!(savingsGoals?.length > 0)}
          />

          {transactions.length > 0 && (
            <div>
              <SectionHead title="Spending Alerts" subtitle="Category limits · this month" />
              <SpendingAlerts transactions={transactions} budgetData={budgetData} />
            </div>
          )}

          {transactions.length === 0 && accounts.length > 0 && (
            <div className="p-6 rounded-2xl border border-dashed bg-muted/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-sm">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Import a bank statement, add transactions manually, or load demo data to explore all features.
                </p>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link href="/statement-import">
                  <button className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors">
                    <Plus className="h-4 w-4" />Import statement
                  </button>
                </Link>
                <Link href="/seed">
                  <button className="flex items-center gap-1.5 text-sm font-semibold bg-muted hover:bg-muted/70 border px-4 py-2.5 rounded-xl transition-colors">
                    <Database className="h-4 w-4" />Load demo data
                  </button>
                </Link>
              </div>
            </div>
          )}

          <div>
            <SectionHead
              title="Accounts"
              subtitle={`${accounts.length} account${accounts.length !== 1 ? "s" : ""} · ${fmt(totalBalance)} total`}
              action={
                <CreateAccountDrawer>
                  <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold">
                    <Plus className="h-3.5 w-3.5" />Add
                  </button>
                </CreateAccountDrawer>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((acc, i) => {
                const Icon = ACCOUNT_ICONS[acc.type] || Wallet;
                return (
                  <div
                    key={acc.id}
                    className={cn(
                      "group relative p-5 rounded-2xl border bg-card hover:shadow-md transition-all overflow-hidden",
                      acc.isDefault && "ring-2 ring-blue-500/50"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full"
                      style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: `${CAT_COLORS[i % CAT_COLORS.length]}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: CAT_COLORS[i % CAT_COLORS.length] }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{getCleanName(acc.name)}</p>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-mono">
                              {getAccountCurrency(acc.name) || currency}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">{acc.type.toLowerCase()}</span>
                          </div>
                        </div>
                        {acc.isDefault && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                            <Star className="h-2.5 w-2.5 fill-current" />Default
                          </span>
                        )}
                      </div>

                      <p className="text-2xl font-black mb-1">
                        {fmt(Number(acc.balance))}
                      </p>
                      <p className="text-xs text-muted-foreground">{acc._count?.transactions || 0} transactions</p>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 flex-1">
                          <Switch
                            checked={acc.isDefault}
                            disabled={acc.isDefault || defaultLoading}
                            onCheckedChange={() => handleDefaultChange(acc)}
                            className="scale-75"
                          />
                          <span className="text-xs text-muted-foreground">
                            {acc.isDefault ? "Default" : "Set as default"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Link href={`/account/${acc.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Link>
                          {!acc.isDefault && (
                            <button
                              onClick={() => handleDeleteAccount(acc)}
                              disabled={deletingId === acc.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <CreateAccountDrawer>
                <button className="p-5 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-blue-500 min-h-[160px]">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                    <Plus className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">Add Account</p>
                </button>
              </CreateAccountDrawer>
            </div>
          </div>

          <div>
            <SectionHead
              title="Spending Overview"
              subtitle="Last 30 days · charts update live"
              action={
                <Link href="/analytics" className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  Full analytics<ChevronRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <DashboardSpendingCharts transactions={transactions} />
          </div>

          {netWorthData?.chartData?.length >= 2 && (
            <div>
              <SectionHead
                title="Net Worth Timeline"
                subtitle="Month by month · all accounts"
                action={
                  <Link href="/analytics" className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    Full analytics<ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <div className="p-5 rounded-2xl border bg-card">
                <NetWorthTimeline netWorthData={netWorthData} />
              </div>
            </div>
          )}

          {(savingsGoals || []).length > 0 && (
            <div>
              <SectionHead
                title="Savings Goals"
                subtitle="Your financial targets"
                action={
                  <button onClick={() => setActiveTab("goals")} className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    View all<ChevronRight className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(savingsGoals || []).slice(0, 4).map(g => (
                  <div key={g.id} className="p-4 rounded-2xl border bg-card flex items-center gap-3">
                    <span className="text-2xl shrink-0">{g.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <span className="text-xs font-bold text-blue-600 shrink-0">{g.progress?.toFixed(0) || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${Math.min(100, g.progress || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground">Last {recentTxns.length} across all accounts</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exportLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border rounded-xl px-3 py-2 hover:bg-muted transition-all"
              >
                {exportLoading ? "Exporting..." : "↓ Export CSV"}
              </button>
              <Link href="/transaction/create">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" />Add
                </Button>
              </Link>
            </div>
          </div>

          {recurringTxns.length > 0 && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-sm items-center">
              <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-blue-700 dark:text-blue-300 text-xs">
                <strong>{recurringTxns.length}</strong> recurring transactions active.{" "}
                <button onClick={() => setActiveTab("subscriptions")} className="underline font-semibold">Manage →</button>
              </p>
            </div>
          )}

          <div className="rounded-2xl border bg-card overflow-hidden divide-y">
            {recentTxns.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No transactions yet"
                sub="Add your first transaction to get started"
                action={<Link href="/transaction/create"><button className="text-sm text-blue-600 font-semibold">Add transaction →</button></Link>}
              />
            ) : recentTxns.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3.5 hover:bg-muted/30 transition-colors group">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  t.type === "INCOME" ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"
                )}>
                  {t.type === "INCOME" ? <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description || t.category}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full capitalize">{t.category}</span>
                    {t.isRecurring && <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><RefreshCw className="h-2.5 w-2.5" />recurring</span>}
                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.date), "dd MMM yyyy")}</span>
                  </div>
                </div>
                <p className={cn("font-bold text-sm shrink-0", t.type === "INCOME" ? "text-emerald-500" : "text-red-500")}>
                  {t.type === "INCOME" ? "+" : "-"}{fmt(Number(t.amount))}
                </p>
                <Link href={`/transaction/create?edit=${t.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <PenBox className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "bills" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-bold">Monthly Bills</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              WiFi, electricity, mobile, water and gas — auto-detected and manually tracked
            </p>
          </div>
          <MonthlyBillsTracker transactions={transactions} />
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          {detectedSubs.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Monthly cost", value: fmt(detectedSubs.reduce((s, d) => s + (d.amount || 0), 0)), color: "text-red-500" },
                { label: "Annual cost", value: fmt(detectedSubs.reduce((s, d) => s + (d.amount || 0), 0) * 12), color: "text-orange-500" },
                { label: "Services", value: detectedSubs.length.toString(), color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-2xl border bg-card text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={cn("text-lg font-black", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <SectionHead
              title="Streaming & Digital Subscriptions"
              subtitle="Auto-detected from your transactions"
              action={
                <button onClick={() => setManualSub(v => !v)} className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />Add manually
                </button>
              }
            />

            {manualSub && (
              <div className="p-4 rounded-2xl border bg-muted/30 mb-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Add subscription manually</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newSub.name}
                    onChange={e => setNewSub(s => ({ ...s, name: e.target.value }))}
                    placeholder="Service name"
                    className="col-span-2 bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                  />
                  <input
                    value={newSub.amount}
                    onChange={e => setNewSub(s => ({ ...s, amount: e.target.value }))}
                    type="number"
                    placeholder={`Amount (${sym})`}
                    className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                  />
                  <select
                    value={newSub.frequency}
                    onChange={e => setNewSub(s => ({ ...s, frequency: e.target.value }))}
                    className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-blue-600 text-white" onClick={() => { toast.success(`${newSub.name} added`); setManualSub(false); }}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setManualSub(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {detectedSubs.length === 0 ? (
              <EmptyState icon={Tv} title="No subscriptions detected" sub="Import 3+ months of bank statements to auto-detect Netflix, Spotify etc." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {detectedSubs.map(sub => (
                  <div key={sub.key} className="flex items-center gap-3 p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border"
                      style={{ background: `${sub.color}15` }}
                    >
                      {sub.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{sub.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                          <Zap className="h-2.5 w-2.5" />auto-detected
                        </span>
                        <span className="text-[10px] text-muted-foreground">{sub.occurrences}× charged</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black">{fmt(sub.amount)}/mo</p>
                      <p className="text-[10px] text-muted-foreground">{fmt(sub.amount * 12)}/yr</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHead title="Recurring Transactions" subtitle="Marked as recurring in your account" />
            {recurringTxns.length === 0 ? (
              <EmptyState icon={RefreshCw} title="No recurring transactions" sub="Mark transactions as recurring when adding them" />
            ) : (
              <div className="space-y-2">
                {recurringTxns.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-4 rounded-2xl border bg-card">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      t.type === "INCOME" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-blue-100 dark:bg-blue-950 text-blue-600"
                    )}>
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.description || t.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full capitalize">{t.recurringInterval?.toLowerCase() || "monthly"}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{t.category}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-black text-sm", t.type === "INCOME" ? "text-emerald-500" : "text-red-500")}>
                        {t.type === "INCOME" ? "+" : "-"}{fmt(Number(t.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {fmt(Number(t.amount) * 12)}/yr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "travel" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-bold">Travel & Transport</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leap card, Dublin Bus, Luas, DART, taxis, fuel and more
            </p>
          </div>
          <TravelTracker transactions={transactions} />
        </div>
      )}

      {activeTab === "insurance" && (
        <div className="space-y-5">
          <SectionHead
            title="Insurance Tracker"
            subtitle="Track all your policies in one place"
            action={
              <button onClick={() => setManualIns(v => !v)} className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <Plus className="h-3.5 w-3.5" />Add policy
              </button>
            }
          />

          {manualIns && (
            <div className="p-5 rounded-2xl border bg-muted/30 space-y-3">
              <p className="text-sm font-bold">Add Insurance Policy</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newIns.type}
                  onChange={e => setNewIns(s => ({ ...s, type: e.target.value }))}
                  className="col-span-2 bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                >
                  {["Life", "Health", "Vehicle", "Home", "Travel", "Term Life", "Critical Illness", "Pet", "Business"].map(t => <option key={t}>{t}</option>)}
                </select>
                <input
                  value={newIns.name}
                  onChange={e => setNewIns(s => ({ ...s, name: e.target.value }))}
                  placeholder="Policy name"
                  className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  value={newIns.provider}
                  onChange={e => setNewIns(s => ({ ...s, provider: e.target.value }))}
                  placeholder="Provider (e.g. LIC, Aviva)"
                  className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                />
                <input
                  value={newIns.premium}
                  onChange={e => setNewIns(s => ({ ...s, premium: e.target.value }))}
                  type="number"
                  placeholder={`Premium (${sym})`}
                  className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                />
                <select
                  value={newIns.frequency}
                  onChange={e => setNewIns(s => ({ ...s, frequency: e.target.value }))}
                  className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Start Date</p>
                  <input
                    value={newIns.startDate}
                    onChange={e => setNewIns(s => ({ ...s, startDate: e.target.value }))}
                    type="date"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">End / Renewal Date</p>
                  <input
                    value={newIns.endDate}
                    onChange={e => setNewIns(s => ({ ...s, endDate: e.target.value }))}
                    type="date"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-600 text-white" onClick={handleAddInsurance}>Add Policy</Button>
                <Button size="sm" variant="outline" onClick={() => setManualIns(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {Object.values(detectedInsurances).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mb-3">
                <Zap className="h-3.5 w-3.5" />Auto-detected from transactions
              </p>
              <div className="space-y-2">
                {Object.values(detectedInsurances).map((ins, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{ins.name}</p>
                      <p className="text-[10px] text-muted-foreground">{ins.count} payments detected · Last: {format(new Date(ins.lastDate), "dd MMM yyyy")}</p>
                    </div>
                    <p className="text-sm font-black shrink-0">{fmt(ins.amount)}/mo</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insurances.length > 0 && (
            <div className="space-y-3">
              {insurances.map(ins => {
                const daysLeft = ins.endDate ? Math.ceil((new Date(ins.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                const isExpiringSoon = daysLeft !== null && daysLeft <= 30;
                return (
                  <div key={ins.id} className={cn("p-5 rounded-2xl border bg-card", isExpiringSoon && "border-amber-400 dark:border-amber-600")}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                          isExpiringSoon ? "bg-amber-100 dark:bg-amber-950 text-amber-600" : "bg-blue-100 dark:bg-blue-950 text-blue-600"
                        )}>
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">{ins.name}</p>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{ins.type}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{ins.provider}</p>
                        </div>
                      </div>
                      <button onClick={() => setInsurances(prev => prev.filter(i => i.id !== ins.id))} className="text-muted-foreground hover:text-red-500 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 rounded-xl bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Premium</p>
                        <p className="text-sm font-bold">{fmt(parseFloat(ins.premium) || 0)}/{ins.frequency === "monthly" ? "mo" : ins.frequency === "yearly" ? "yr" : "qtr"}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-muted/50">
                        <p className="text-[10px] text-muted-foreground">Annual</p>
                        <p className="text-sm font-bold">{fmt((parseFloat(ins.premium) || 0) * (ins.frequency === "monthly" ? 12 : ins.frequency === "quarterly" ? 4 : 1))}</p>
                      </div>
                      <div className={cn("p-2 rounded-xl", isExpiringSoon ? "bg-amber-100 dark:bg-amber-950" : "bg-muted/50")}>
                        <p className="text-[10px] text-muted-foreground">Renewal</p>
                        <p className={cn("text-sm font-bold", isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "")}>
                          {ins.endDate ? (isExpiringSoon ? `${daysLeft}d left` : format(new Date(ins.endDate), "dd MMM yy")) : "—"}
                        </p>
                      </div>
                    </div>

                    {isExpiringSoon && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Policy renews in {daysLeft} days — review your coverage before renewal
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {Object.values(detectedInsurances).length === 0 && insurances.length === 0 && (
            <EmptyState
              icon={Shield}
              title="No insurance policies tracked"
              sub="Add your life, health, vehicle or home insurance to track premiums and renewal dates"
              action={<button onClick={() => setManualIns(true)} className="text-sm text-blue-600 font-semibold">Add your first policy →</button>}
            />
          )}
        </div>
      )}

      {activeTab === "payday" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold">Payday Tracker</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track spending between paydays and forecast if you'll make it</p>
          </div>
          <PaydayTracker transactions={transactions} />
        </div>
      )}

      {activeTab === "split" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold">Bill Split Calculator</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Split any bill between friends with tip calculation</p>
          </div>
          <BillSplitCalculator transactions={transactions} />
        </div>
      )}

      {activeTab === "loans" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold">Loan & EMI Tracker</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track home loans, car finance and personal loans</p>
          </div>
          <LoanTracker />
        </div>
      )}

      {activeTab === "goals" && (
        <div className="space-y-4">
          <SectionHead
            title="Savings Goals"
            subtitle={`${(savingsGoals || []).filter(g => g.completed).length} of ${(savingsGoals || []).length} completed`}
            action={
              <button onClick={() => setGoalForm(v => !v)} className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                <Plus className="h-3.5 w-3.5" />{goalForm ? "Cancel" : "New goal"}
              </button>
            }
          />

          {goalForm && (
            <div className="p-5 rounded-2xl border bg-muted/30 space-y-3">
              <div className="flex flex-wrap gap-2">
                {GOAL_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setGoalData(d => ({ ...d, emoji: e }))}
                    className={cn("w-9 h-9 text-lg rounded-xl transition-all", goalData.emoji === e ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950 scale-110" : "bg-muted hover:bg-muted/80")}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={goalData.name}
                onChange={e => setGoalData(d => ({ ...d, name: e.target.value }))}
                placeholder="Goal name (e.g. Holiday in Japan)"
                className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{sym}</span>
                  <input
                    value={goalData.targetAmount}
                    onChange={e => setGoalData(d => ({ ...d, targetAmount: e.target.value }))}
                    type="number"
                    placeholder="Target amount"
                    className="w-full pl-7 pr-3 py-2.5 text-sm bg-background rounded-xl outline-none border focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <input
                  value={goalData.targetDate}
                  onChange={e => setGoalData(d => ({ ...d, targetDate: e.target.value }))}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleGoalCreate} disabled={goalLoading} className="flex-1 bg-blue-600 text-white">
                  {goalLoading ? "Creating..." : "Create Goal"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setGoalForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {(savingsGoals || []).length === 0 && !goalForm ? (
            <EmptyState
              icon={Target}
              title="No savings goals yet"
              sub="Set targets and track your progress towards financial milestones"
              action={<button onClick={() => setGoalForm(true)} className="text-sm text-blue-600 font-semibold">Create first goal →</button>}
            />
          ) : (
            <div className="space-y-3">
              {(savingsGoals || []).map(goal => {
                const pct = Math.min(100, goal.progress || 0);
                return (
                  <div key={goal.id} className={cn("p-5 rounded-2xl border bg-card", goal.completed && "opacity-80")}>
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-3xl shrink-0 leading-none mt-1">{goal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-bold">{goal.name}</p>
                          <div className="flex items-center gap-2">
                            {goal.completed ? (
                              <span className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                                <CheckCircle2 className="h-2.5 w-2.5" />Complete
                              </span>
                            ) : (
                              <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                goal.onTrack ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300"
                              )}>
                                {goal.onTrack ? "On track ↗" : "Behind ↘"}
                              </span>
                            )}
                            <button onClick={() => { deleteGoalFn(goal.id); window.location.reload(); }} className="text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target: {fmt(goal.targetAmount || 0)}
                          {goal.targetDate && ` · Due ${format(new Date(goal.targetDate), "dd MMM yyyy")}`}
                        </p>
                      </div>
                    </div>

                    <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                        style={{ width: `${pct}%` }}
                      />
                      {pct > 10 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white">{pct.toFixed(0)}%</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Saved: <strong className="text-foreground">{fmt(goal.currentSaved || 0)}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt((goal.targetAmount || 0) - (goal.currentSaved || 0))} to go
                      </p>
                    </div>

                    {!goal.completed && goal.monthlyNeeded > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                          { label: "Days remaining", value: `${goal.daysLeft || 0}d` },
                          { label: "Need per month", value: fmt(goal.monthlyNeeded || 0) },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-xl bg-muted/50 text-center">
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            <p className="text-sm font-bold">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}