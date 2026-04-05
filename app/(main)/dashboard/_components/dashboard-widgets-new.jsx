"use client";

import { useState } from "react";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import {
  CheckCircle2, Circle, ArrowRight, Sparkles,
  X, AlertTriangle, AlertCircle, TrendingUp,
  Target, Upload, CreditCard, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ────────────────────────────────────────────────────────────────
// ONBOARDING CHECKLIST
// Shows only to new users — dismisses permanently via localStorage
// ────────────────────────────────────────────────────────────────
export function OnboardingChecklist({ hasAccounts, hasTransactions, hasBudget, hasGoals }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("finlytics_onboarding_done") === "1"; } catch { return false; }
  });

  // All steps done — auto-hide after a short delay
  const steps = [
    {
      id:       "account",
      done:     hasAccounts,
      label:    "Create your first account",
      sub:      "Add a bank account to get started",
      icon:     CreditCard,
      href:     "/dashboard",
      action:   "Create account →",
    },
    {
      id:       "import",
      done:     hasTransactions,
      label:    "Import a bank statement",
      sub:      "Upload a CSV to auto-categorise your transactions",
      icon:     Upload,
      href:     "/statement-import",
      action:   "Import statement →",
    },
    {
      id:       "budget",
      done:     hasBudget,
      label:    "Set a monthly budget",
      sub:      "Track how much you spend vs your limit",
      icon:     Target,
      href:     "/dashboard",
      action:   "Set budget →",
    },
    {
      id:       "analytics",
      done:     hasTransactions,
      label:    "Explore your analytics",
      sub:      "See AI insights, spending patterns and forecasts",
      icon:     BarChart2,
      href:     "/analytics",
      action:   "View analytics →",
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  // Don't show if dismissed or all complete
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("finlytics_onboarding_done", "1"); } catch {}
  };

  return (
    <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
              {allDone ? "You're all set! 🎉" : "Get started with FinLytics"}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              {completedCount} of {steps.length} steps complete
            </p>
          </div>
        </div>
        <button onClick={dismiss}
          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900">
          <X className="h-4 w-4"/>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => (
          <div key={step.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              step.done
                ? "bg-white/50 dark:bg-white/5 opacity-60"
                : "bg-white dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700"
            )}>
            {step.done
              ? <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0"/>
              : <Circle className="h-5 w-5 text-blue-300 dark:text-blue-600 shrink-0"/>
            }
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-semibold", step.done ? "line-through text-muted-foreground" : "text-slate-800 dark:text-slate-200")}>
                {step.label}
              </p>
              {!step.done && <p className="text-[10px] text-muted-foreground">{step.sub}</p>}
            </div>
            {!step.done && (
              <Link href={step.href}>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline whitespace-nowrap">
                  {step.action}
                </span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {allDone && (
        <button onClick={dismiss}
          className="mt-3 w-full text-xs text-blue-600 dark:text-blue-400 font-semibold py-2 hover:underline">
          Dismiss this checklist
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// SPENDING ALERTS
// Shows category-level budget warnings on the dashboard
// ────────────────────────────────────────────────────────────────
const DEFAULT_LIMITS = {
  food:           300,
  groceries:      400,
  entertainment:  100,
  shopping:       200,
  transportation: 150,
};

export function SpendingAlerts({ transactions, budgetData }) {
  const [limits, setLimits]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("finlytics_cat_limits") || "{}"); } catch { return {}; }
  });
  const [editing, setEditing]     = useState(false);
  const [tempLimits, setTempLimits] = useState(limits);
  const [dismissed, setDismissed] = useState([]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate this-month spend per category
  const monthExpenses = (transactions || []).filter(t =>
    t.type === "EXPENSE" && new Date(t.date) >= monthStart
  );
  const catSpend = monthExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const effectiveLimits = { ...DEFAULT_LIMITS, ...limits };

  // Build alerts — only for categories with limits AND spend
  const alerts = Object.entries(effectiveLimits)
    .map(([cat, limit]) => {
      const spent = catSpend[cat] || 0;
      const pct   = limit > 0 ? (spent / limit) * 100 : 0;
      return { cat, spent, limit, pct };
    })
    .filter(a => a.pct >= 70 && a.spent > 0 && !dismissed.includes(a.cat))
    .sort((a, b) => b.pct - a.pct);

  const saveLimits = () => {
    const cleaned = {};
    Object.entries(tempLimits).forEach(([k, v]) => {
      if (parseFloat(v) > 0) cleaned[k] = parseFloat(v);
    });
    setLimits(cleaned);
    try { localStorage.setItem("finlytics_cat_limits", JSON.stringify(cleaned)); } catch {}
    setEditing(false);
  };

  const CATS = ["food", "groceries", "entertainment", "shopping", "transportation", "utilities", "healthcare", "personal", "travel", "bills"];

  if (alerts.length === 0 && !editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="w-full flex items-center justify-between p-4 rounded-2xl border border-dashed hover:bg-muted/40 transition-colors text-sm text-muted-foreground hover:text-foreground">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4"/>
          <span>Set category spending limits</span>
        </div>
        <ArrowRight className="h-4 w-4"/>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active alerts */}
      {alerts.map(a => (
        <div key={a.cat}
          className={cn(
            "flex items-start gap-3 p-3.5 rounded-2xl border",
            a.pct >= 100
              ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900"
          )}>
          {a.pct >= 100
            ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5"/>
            : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className={cn("text-xs font-bold capitalize",
                a.pct >= 100 ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300")}>
                {a.cat} — {a.pct >= 100 ? "Over budget" : `${Math.round(a.pct)}% of limit`}
              </p>
              <button onClick={() => setDismissed(p => [...p, a.cat])}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5"/>
              </button>
            </div>
            <div className="h-1.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden mb-1">
              <div
                className={cn("h-full rounded-full transition-all", a.pct >= 100 ? "bg-red-500" : "bg-amber-500")}
                style={{ width: `${Math.min(100, a.pct)}%` }}
              />
            </div>
            <p className={cn("text-[10px]",
              a.pct >= 100 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}>
              Spent {fmt(a.spent)} of {fmt(a.limit)} limit this month
            </p>
          </div>
        </div>
      ))}

      {/* Edit limits */}
      {editing ? (
        <div className="p-4 rounded-2xl border bg-muted/30 space-y-3">
          <p className="text-xs font-bold">Monthly limits per category</p>
          <div className="grid grid-cols-2 gap-2">
            {CATS.map(cat => (
              <div key={cat}>
                <label className="text-[10px] text-muted-foreground capitalize block mb-1">{cat}</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={tempLimits[cat] ?? DEFAULT_LIMITS[cat] ?? ""}
                    onChange={e => setTempLimits(p => ({ ...p, [cat]: e.target.value }))}
                    placeholder="No limit"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-background rounded-lg border outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveLimits}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
              Save limits
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 border rounded-xl text-xs hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setEditing(true); setTempLimits(limits); }}
          className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors">
          Edit spending limits →
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// NET WORTH TIMELINE
// Month-by-month net worth chart — most motivating personal finance chart
// ────────────────────────────────────────────────────────────────
function NetWorthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      <p className="text-blue-600 dark:text-blue-400 font-black">
        {fmt(Number(payload[0]?.value || 0))}
      </p>
    </div>
  );
}

export function NetWorthTimeline({ netWorthData }) {
  const chartData = netWorthData?.chartData || [];
  const current   = netWorthData?.currentNetWorth || 0;
  const change    = netWorthData?.change || 0;
  const isUp      = change >= 0;

  if (chartData.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed">
        <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2"/>
        <p className="text-sm text-muted-foreground">Import 2+ months of data to see your net worth timeline</p>
      </div>
    );
  }

  // Format chart data — label is already "Jan 2025" etc from the action
  const formatted = chartData.map(d => ({
    month: (d.month || "").split(" ")[0], // "Jan", "Feb" etc
    netWorth: Number(d.netWorth || 0),
  }));

  // Find min for reference line (breakeven)
  const minVal  = Math.min(...formatted.map(d => d.netWorth));
  const maxVal  = Math.max(...formatted.map(d => d.netWorth));
  const padding = (maxVal - minVal) * 0.1;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Current net worth</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {fmt(current)}
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold",
          isUp ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
               : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
        )}>
          <TrendingUp className={cn("h-4 w-4", !isUp && "rotate-180")}/>
          {isUp ? "+" : ""}{fmt(Math.abs(change))} vs last month
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#378ADD" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9 }}
            tickFormatter={v => v >= 1000 ? `${fmt((v / 1000))}k` : `${fmt(v)}`}
            domain={[minVal - padding, maxVal + padding]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<NetWorthTooltip/>}/>
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#378ADD"
            strokeWidth={2.5}
            fill="url(#nwGrad)"
            dot={{ r: 4, fill: "#378ADD", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#378ADD" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Month breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {formatted.slice(-3).map((d, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-muted/50 text-center">
            <p className="text-[10px] text-muted-foreground">{d.month}</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {d.netWorth >= 1000 ? `${fmtCompact(d.netWorth / 1000)}k` : fmt(d.netWorth)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}