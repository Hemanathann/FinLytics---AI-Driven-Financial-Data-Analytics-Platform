"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Wallet, Flame,
  Trophy, Zap, CheckCircle2, Moon, Target, AlertCircle,
  Info, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt, fmtCompact } from "@/lib/currency-utils";

// ── Shared tooltip ─────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-xl shadow-lg p-3 text-sm min-w-[130px]">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-muted-foreground text-xs capitalize">{p.name}</span>
          </div>
          <span className="font-medium text-xs">{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  NET WORTH CARD
// ══════════════════════════════════════════════════════════════
export function NetWorthCard({ data }) {
  const { currentNetWorth, change, changePct, chartData, accounts } = data;
  const isPositive = change >= 0;
  const TrendIcon = change === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />Net Worth
            </CardTitle>
            <p className="text-3xl font-bold mt-1 tracking-tight">
              {fmt(currentNetWorth)}
            </p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
            isPositive ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          )}>
            <TrendIcon className="h-3.5 w-3.5" />
            {isPositive ? "+" : ""}{changePct}% vs last month
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Chart */}
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0]} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => Math.abs(v) >= 1000 ? `${fmtCompact(v / 1000)}k` : fmt(v)} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2.5}
              fill="url(#nwGrad)" name="Net Worth" dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Account breakdown */}
        {accounts.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Accounts</p>
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", acc.type === "SAVINGS" ? "bg-green-500" : "bg-blue-500")} />
                  <span className="text-muted-foreground">{acc.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{acc.type.toLowerCase()}</Badge>
                </div>
                <span className="font-semibold">{fmt(acc.balance)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  SPENDING STREAK CARD
// ══════════════════════════════════════════════════════════════
const STREAK_ICONS = {
  "🏆": { bg: "from-amber-400 to-yellow-500", text: "Legendary!" },
  "🔥": { bg: "from-orange-500 to-red-500", text: "On fire!" },
  "⚡": { bg: "from-yellow-400 to-orange-400", text: "Building momentum" },
  "✅": { bg: "from-green-400 to-emerald-500", text: "Good start" },
  "💤": { bg: "from-slate-400 to-slate-500", text: "Start your streak" },
};

export function SpendingStreakCard({ data }) {
  const { currentStreak, longestStreak, emoji, streakType, dailyLimit, last30, hasBudget } = data;
  const style = STREAK_ICONS[emoji] || STREAK_ICONS["✅"];

  // Show last 14 days for the mini grid
  const last14 = last30.slice(-14);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Spending Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Main streak display */}
        <div className={cn("rounded-2xl p-5 bg-gradient-to-br text-white mb-4 text-center", style.bg)}>
          <div className="text-5xl mb-2">{emoji}</div>
          <div className="text-5xl font-black mb-1">{currentStreak}</div>
          <div className="text-sm opacity-90 font-medium">{style.text}</div>
          <div className="text-xs opacity-75 mt-1 capitalize">{streakType}</div>
          {dailyLimit && (
            <div className="text-xs opacity-80 mt-1">Daily limit: {fmt(dailyLimit)}</div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Best</p>
            <p className="text-2xl font-bold text-amber-500">{longestStreak}</p>
            <p className="text-[10px] text-muted-foreground">days</p>
          </div>
        </div>

        {/* 14-day mini calendar */}
        <p className="text-xs text-muted-foreground mb-2">Last 14 days</p>
        <div className="grid grid-cols-7 gap-1">
          {last14.map((day, i) => {
            const condition = hasBudget ? day.underLimit : day.hasActivity;
            return (
              <div key={i} title={`${day.date}: ${fmt(day.spent)}`}
                className={cn(
                  "h-7 rounded-lg flex items-center justify-center",
                  day.hasActivity
                    ? condition
                      ? "bg-green-100 dark:bg-green-900 text-green-600"
                      : "bg-red-100 dark:bg-red-900 text-red-600"
                    : "bg-muted/50 text-muted-foreground/30"
                )}>
                {day.hasActivity
                  ? condition ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />
                  : <Moon className="h-3 w-3" />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{hasBudget ? "Under limit" : "Active"}</span>
          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500" />{hasBudget ? "Over limit" : "—"}</span>
          <span className="flex items-center gap-1"><Moon className="h-3 w-3" />No spending</span>
        </div>

        {!hasBudget && (
          <p className="text-xs text-muted-foreground mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
            💡 Set a monthly budget to track an under-limit streak
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  BUDGET VS ACTUAL CHART
// ══════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  over: { label: "Over budget", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900", icon: AlertCircle },
  "on-track": { label: "On track", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900", icon: CheckCircle2 },
  under: { label: "Under budget", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900", icon: Info },
};

const CAT_COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];

export function BudgetVsActualCard({ data }) {
  const {
    totalBudget, totalSpent, remaining, pctUsed,
    expectedSpend, budgetStatus, categories, hasBudget, daysPassed, daysInMonth,
  } = data;

  const statusCfg = STATUS_CONFIG[budgetStatus] || STATUS_CONFIG["on-track"];
  const StatusIcon = statusCfg.icon;

  if (!hasBudget) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Budget vs Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium">No budget set</p>
            <p className="text-xs text-muted-foreground mt-1">Set a monthly budget on the dashboard to track spending vs your goal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Budget vs Actual
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Day {daysPassed} of {daysInMonth} · This month
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold", statusCfg.bg, statusCfg.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Budget",    val: fmt(totalBudget),               col: "text-foreground" },
            { label: "Spent",     val: fmt(totalSpent),                col: pctUsed > 100 ? "text-red-500" : "text-foreground" },
            { label: "Remaining", val: fmt(Math.abs(remaining || 0)),  col: (remaining || 0) >= 0 ? "text-green-500" : "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={cn("text-sm font-bold leading-tight", s.col)}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Total used</span>
            <span className={cn("font-semibold", pctUsed > 100 ? "text-red-500" : pctUsed > 80 ? "text-orange-500" : "text-green-500")}>
              {pctUsed?.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pctUsed || 0, 100)}%`,
                background: pctUsed > 100 ? "#ef4444" : pctUsed > 80 ? "#f97316" : "#22c55e"
              }} />
          </div>
          {expectedSpend && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Expected by day {daysPassed}: {fmt(expectedSpend)}
            </p>
          )}
        </div>

        {/* Category chart */}
        {categories.length > 0 && (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Category</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categories} layout="vertical" margin={{ left: 0, right: 50, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={(v) => v >= 1000 ? `${fmtCompact(v / 1000)}k` : fmt(v)} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={80} tickFormatter={(v) => v.length > 10 ? v.slice(0,10)+"…" : v} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="actual" name="Spent" radius={[0, 6, 6, 0]}>
                  {categories.map((c, i) => (
                    <Cell key={i} fill={c.overBudget ? "#ef4444" : CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}