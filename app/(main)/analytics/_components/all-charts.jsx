"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, LabelList,
} from "recharts";
import {
  TrendingUp, TrendingDown, Euro, Activity,
  BarChart2, Wallet, Minus, AlertTriangle, CheckCircle2,
  Sparkles, ShoppingBag, Brain, ShieldCheck, AlertCircle,
  Info, Repeat2, Lightbulb, PieChart as PieIcon,
  Calendar, Target, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fmt, fmtCompact } from "@/lib/currency-utils";

// ─── COLOR PALETTE ─────────────────────────────────────────────
const PALETTE = ["#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316","#8b5cf6","#06b6d4"];
const GREEN   = "#22c55e";
const RED     = "#ef4444";
const BLUE    = "#3b82f6";
const PURPLE  = "#8b5cf6";
const AMBER   = "#f59e0b";

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border/60 rounded-2xl shadow-xl p-3.5 text-sm min-w-[150px] backdrop-blur-sm">
      <p className="font-bold text-foreground mb-2.5 text-xs uppercase tracking-wide">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
            <span className="text-muted-foreground capitalize text-xs">{p.name}</span>
          </div>
          <span className="font-semibold text-foreground">
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── STATS CARDS ───────────────────────────────────────────────
export function AnalyticsStats({ stats }) {
  const cards = [
    {
      label: "Total Income",
      value: stats.totalIncome,
      sub: "Last 6 months",
      icon: TrendingUp,
      gradient: "from-emerald-500/15 to-green-500/5",
      border: "border-emerald-200/60 dark:border-emerald-800/40",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      color: "text-emerald-600 dark:text-emerald-400",
      trend: null,
    },
    {
      label: "Total Expenses",
      value: stats.totalExpense,
      sub: "Last 6 months",
      icon: TrendingDown,
      gradient: "from-red-500/15 to-rose-500/5",
      border: "border-red-200/60 dark:border-red-800/40",
      iconBg: "bg-red-100 dark:bg-red-900/60",
      color: "text-red-600 dark:text-red-400",
      trend: null,
    },
    {
      label: "Net Savings",
      value: stats.netSavings,
      sub: `${stats.savingsRate}% savings rate`,
      icon: Euro,
      gradient: stats.netSavings >= 0 ? "from-blue-500/15 to-cyan-500/5" : "from-red-500/15 to-rose-500/5",
      border: stats.netSavings >= 0 ? "border-blue-200/60 dark:border-blue-800/40" : "border-red-200/60 dark:border-red-800/40",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      color: stats.netSavings >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400",
      trend: null,
    },
    {
      label: "This Month",
      value: stats.thisMonthExpense,
      sub: stats.monthOverMonthChange !== 0
        ? `${stats.monthOverMonthChange > 0 ? "▲" : "▼"} ${Math.abs(stats.monthOverMonthChange)}% vs last month`
        : "vs last month",
      icon: Activity,
      gradient: stats.monthOverMonthChange > 10 ? "from-orange-500/15 to-amber-500/5" : "from-teal-500/15 to-green-500/5",
      border: stats.monthOverMonthChange > 10 ? "border-orange-200/60 dark:border-orange-800/40" : "border-teal-200/60 dark:border-teal-800/40",
      iconBg: stats.monthOverMonthChange > 10 ? "bg-orange-100 dark:bg-orange-900/60" : "bg-teal-100 dark:bg-teal-900/60",
      color: stats.monthOverMonthChange > 10 ? "text-orange-600 dark:text-orange-400" : "text-teal-600 dark:text-teal-400",
      trend: stats.monthOverMonthChange,
    },
    {
      label: "Transactions",
      value: null,
      raw: stats.transactionCount.toString(),
      sub: "Last 6 months",
      icon: BarChart2,
      gradient: "from-violet-500/15 to-purple-500/5",
      border: "border-violet-200/60 dark:border-violet-800/40",
      iconBg: "bg-violet-100 dark:bg-violet-900/60",
      color: "text-violet-600 dark:text-violet-400",
      trend: null,
    },
    {
      label: "Avg Monthly",
      value: stats.avgMonthlySpend,
      sub: "Per month average",
      icon: Wallet,
      gradient: "from-amber-500/15 to-yellow-500/5",
      border: "border-amber-200/60 dark:border-amber-800/40",
      iconBg: "bg-amber-100 dark:bg-amber-900/60",
      color: "text-amber-600 dark:text-amber-400",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={cn(
            "relative overflow-hidden border transition-all hover:shadow-md hover:-translate-y-0.5",
            c.border
          )}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", c.gradient)} />
          <CardContent className="relative pt-4 pb-4">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", c.iconBg)}>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground leading-tight uppercase tracking-wide">{c.label}</p>
            <p className={cn("text-lg font-extrabold mt-1 tabular-nums", c.color)}>
              {c.raw ?? fmt(c.value ?? 0)}
            </p>
            <p className={cn("text-[10px] mt-0.5 font-medium",
              c.trend != null && c.trend > 10 ? "text-red-500" :
              c.trend != null && c.trend < -10 ? "text-green-500" :
              "text-muted-foreground"
            )}>
              {c.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── MONTHLY OVERVIEW ──────────────────────────────────────────
export function MonthlyOverviewChart({ monthlySummary }) {
  const [tab, setTab] = useState("grouped");

  const worstMonth = [...monthlySummary].sort((a, b) => b.expense - a.expense)[0];
  const bestSavingsMonth = [...monthlySummary].sort((a, b) => b.net - a.net)[0];

  return (
    <Card className="col-span-2 border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart2 className="h-3.5 w-3.5 text-white" />
              </div>
              Income vs Expenses
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Peak spend: <span className="font-semibold text-red-500">{worstMonth?.month}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Best savings: <span className="font-semibold text-emerald-500">{bestSavingsMonth?.month}</span>
              </span>
            </p>
          </div>
          <div className="flex text-xs border border-border/60 rounded-xl overflow-hidden self-start shrink-0 bg-muted/30">
            {[["grouped","Grouped"],["stacked","Stacked"],["net","Net Savings"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn("px-3 py-1.5 transition-all font-medium", tab === key ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          {tab === "net" ? (
            <AreaChart data={monthlySummary} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
              <Area type="monotone" dataKey="net" stroke={BLUE} strokeWidth={2.5} fill="url(#netGrad)" name="Net Savings" dot={{ r: 4, fill: BLUE, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            </AreaChart>
          ) : (
            <BarChart data={monthlySummary} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="income" fill={GREEN} name="Income" radius={[5,5,0,0]} stackId={tab === "stacked" ? "a" : undefined} maxBarSize={40} />
              <Bar dataKey="expense" fill={RED} name="Expense" radius={tab === "stacked" ? [5,5,0,0] : [5,5,0,0]} stackId={tab === "stacked" ? "a" : undefined} maxBarSize={40} />
            </BarChart>
          )}
        </ResponsiveContainer>
        {/* Quick insight strip — shows PREVIOUS complete month + current month */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/40 flex-wrap">
          {(() => {
            // slice(-2,-1) = previous full month; slice(-1) = current (possibly partial) month
            const prev = monthlySummary.slice(-2, -1)[0];
            const curr = monthlySummary.slice(-1)[0];
            return [
              { label: "Last month income",  val: fmt(prev?.income  ?? 0), col: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
              { label: "Last month expense",  val: fmt(prev?.expense ?? 0), col: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-950/40" },
              { label: "Last month net",      val: `${(prev?.net ?? 0) >= 0 ? "+" : ""}${fmt(prev?.net ?? 0)}`, col: (prev?.net ?? 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
              { label: "This month expense",  val: fmt(curr?.expense ?? 0), col: "text-orange-600 dark:text-orange-400",   bg: "bg-orange-50 dark:bg-orange-950/40" },
            ].map((s) => (
              <div key={s.label} className={cn("px-3 py-2 rounded-xl flex-1 min-w-[100px]", s.bg)}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
                <p className={cn("text-sm font-bold mt-0.5 tabular-nums", s.col)}>{s.val}</p>
              </div>
            ));
          })()}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── CATEGORY BREAKDOWN ────────────────────────────────────────
export function CategoryBreakdownChart({ categoryBreakdown }) {
  const [tab, setTab] = useState("donut");
  const top8 = categoryBreakdown.slice(0, 8);
  const topCat = top8[0];

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 8) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <PieIcon className="h-3.5 w-3.5 text-white" />
              </div>
              Spending by Category
            </CardTitle>
            {topCat && (
              <p className="text-xs text-muted-foreground mt-1">
                Top: <span className="font-semibold capitalize text-orange-500">{topCat.category}</span> — {topCat.percentage}% of total
              </p>
            )}
          </div>
          <div className="flex text-xs border border-border/60 rounded-xl overflow-hidden self-start bg-muted/30 shrink-0">
            {[["donut","Donut"],["bar","Bar"],["list","List"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn("px-3 py-1.5 transition-all font-medium", tab === key ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "donut" && (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={top8} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={55} outerRadius={100} labelLine={false} label={renderLabel} paddingAngle={2}>
                {top8.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), ""]} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span className="capitalize">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {tab === "bar" && (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top8} layout="vertical" margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} tickFormatter={(v) => v.length > 11 ? v.slice(0,11)+"…" : v} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [fmt(v), "Amount"]} />
              <Bar dataKey="amount" radius={[0,6,6,0]} maxBarSize={20}>
                {top8.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                <LabelList dataKey="percentage" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {tab === "list" && (
          <div className="space-y-2.5 mt-1 max-h-[220px] overflow-y-auto pr-1">
            {top8.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="capitalize font-medium">{c.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-muted-foreground">{c.percentage}%</span>
                    <span className="font-bold tabular-nums">{fmt(c.amount)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full ml-5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.percentage}%`, background: PALETTE[i % PALETTE.length] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── SPENDING HEATMAP ──────────────────────────────────────────
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function getHeatColor(amount, max) {
  if (amount === 0) return "bg-muted/40 dark:bg-muted/20";
  const r = amount / max;
  if (r < 0.15) return "bg-indigo-100 dark:bg-indigo-900/70";
  if (r < 0.35) return "bg-indigo-300 dark:bg-indigo-700";
  if (r < 0.55) return "bg-indigo-400 dark:bg-indigo-600";
  if (r < 0.75) return "bg-indigo-500";
  return "bg-indigo-700 dark:bg-indigo-400";
}

export function SpendingHeatmap({ heatmapData }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...heatmapData.map((d) => d.amount), 1);

  const weeks = [];
  let week = [];
  heatmapData.forEach((d, i) => {
    const day = parseISO(d.date).getDay();
    if (i === 0) for (let j = 0; j < day; j++) week.push(null);
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const totalDays  = heatmapData.filter((d) => d.amount > 0).length;
  const totalSpend = heatmapData.reduce((s, d) => s + d.amount, 0);
  const peakDay    = [...heatmapData].sort((a, b) => b.amount - a.amount)[0];

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <Calendar className="h-3.5 w-3.5 text-white" />
          </div>
          Spending Calendar
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
          <span className="flex items-center gap-1">Active days: <span className="font-semibold text-foreground">{totalDays}</span></span>
          <span className="flex items-center gap-1">Peak: <span className="font-semibold text-indigo-500">{peakDay?.date} ({fmt(peakDay?.amount ?? 0)})</span></span>
          <span className="flex items-center gap-1">Total: <span className="font-semibold text-foreground">{fmt(totalSpend)}</span></span>
        </div>
      </CardHeader>
      <CardContent>
        {hovered && (
          <div className="mb-3 text-xs bg-muted/60 border border-border/40 px-3 py-2 rounded-xl inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold">{hovered.date}</span>
            <span className="text-indigo-500 font-bold">{fmt(hovered.amount)}</span>
            {hovered.amount === 0 && <span className="text-muted-foreground"> — no spending</span>}
          </div>
        )}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 min-w-max">
            <div className="flex flex-col gap-1 mr-2 pt-0.5">
              {DAY_LABELS.map((d) => (
                <div key={d} className="h-[14px] text-[9px] text-muted-foreground leading-none w-6 font-medium">{d}</div>
              ))}
            </div>
            {weeks.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {wk.map((d, di) => d ? (
                  <div key={di}
                    onMouseEnter={() => setHovered(d)}
                    onMouseLeave={() => setHovered(null)}
                    title={`${d.date}: ${fmt(d.amount)}`}
                    className={cn("w-[14px] h-[14px] rounded-sm cursor-default transition-all hover:scale-125 hover:ring-1 hover:ring-indigo-400", getHeatColor(d.amount, max))}
                  />
                ) : (
                  <div key={di} className="w-[14px] h-[14px]" />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["bg-muted/40","bg-indigo-100 dark:bg-indigo-900/70","bg-indigo-300 dark:bg-indigo-700","bg-indigo-500","bg-indigo-700 dark:bg-indigo-400"].map((cls, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-sm", cls)} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── FORECAST CHART ────────────────────────────────────────────
export function ForecastChart({ data }) {
  // Action returns: { chartData: [{label, x, y, predicted}], forecast, message }
  const { chartData = [], forecast, message } = data || {};

  const lastActual = [...chartData].reverse().find((d) => d.y !== null && d.y !== undefined);
  const trendUp = forecast && lastActual ? forecast.amount > lastActual.y : false;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  const trendColor = trendUp ? "text-red-500" : "text-emerald-500";

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          Expense Forecast
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Linear regression model — dashed = predicted</p>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        ) : (
          <>
            {forecast && (
              <div className="flex items-center gap-3 mb-4 p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/60">
                <div className={cn("p-2 rounded-xl bg-white dark:bg-background shadow-sm", trendColor)}>
                  <TrendIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Predicted for {forecast.month}</p>
                  <p className="text-xs text-muted-foreground">{forecast.changeText} · {forecast.confidence} confidence</p>
                </div>
                <p className={cn("text-2xl font-extrabold shrink-0 tabular-nums", trendColor)}>{fmt(forecast.amount)}</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0]} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line dataKey="y" stroke={PURPLE} strokeWidth={2.5} dot={{ r: 4, fill: PURPLE, strokeWidth: 2, stroke: "#fff" }} connectNulls={false} name="Actual" activeDot={{ r: 6 }} />
                <Line dataKey="predicted" stroke="#d946ef" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill: "#d946ef", strokeWidth: 2, stroke: "#fff" }} name="Forecast" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ANOMALY ALERTS ────────────────────────────────────────────
export function AnomalyAlerts({ data }) {
  const { anomalies, message } = data;
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-white" />
              </div>
              Anomaly Detection
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Unusual spending flagged via z-score analysis</p>
          </div>
          {anomalies?.length > 0 && (
            <Badge variant="destructive" className="shrink-0 rounded-full">
              {anomalies.length} alert{anomalies.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {message || !anomalies ? (
          <p className="text-sm text-muted-foreground text-center py-8">{message || "Not enough data"}</p>
        ) : anomalies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">All Clear!</p>
              <p className="text-xs text-muted-foreground mt-0.5">No unusual transactions detected this month</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {anomalies.map((a) => (
              <div key={a.id} className={cn("flex gap-3 p-3.5 rounded-2xl border",
                a.severity === "high"
                  ? "border-red-200/60 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/30"
                  : "border-orange-200/60 bg-orange-50/50 dark:border-orange-900/60 dark:bg-orange-950/30")}>
                <div className={cn("mt-0.5 shrink-0 w-7 h-7 rounded-xl flex items-center justify-center",
                  a.severity === "high" ? "bg-red-100 dark:bg-red-900/60 text-red-500" : "bg-orange-100 dark:bg-orange-900/60 text-orange-500")}>
                  {a.severity === "high" ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{a.description}</p>
                    <p className={cn("text-sm font-extrabold shrink-0 tabular-nums", a.severity === "high" ? "text-red-600" : "text-orange-600")}>{fmt(a.amount)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 capitalize rounded-full">{a.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{a.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AI INSIGHTS ───────────────────────────────────────────────
const INSIGHT_STYLES = {
  info:    { bg: "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40",   icon: "text-blue-500" },
  warning: { bg: "bg-orange-50/60 dark:bg-orange-950/30 border-orange-200/60 dark:border-orange-800/40", icon: "text-orange-500" },
  success: { bg: "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40", icon: "text-emerald-600" },
};
const INSIGHT_ICONS = {
  pie: PieIcon, trend: TrendingUp, savings: Wallet,
  recurring: Repeat2, budget: Target, check: CheckCircle2,
  alert: AlertCircle,
};

export function AIInsightsCard({ data }) {
  const { insights, narrative } = data;
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          AI Financial Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Powered by Gemini · Updated in real-time</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {narrative && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-purple-950/40 dark:to-blue-950/40 border border-purple-200/60 dark:border-purple-800/40">
            <div className="flex gap-2.5">
              <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>
        )}
        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((ins, i) => {
              const Icon = INSIGHT_ICONS[ins.icon] || INSIGHT_ICONS[ins.type] || Lightbulb;
              const style = INSIGHT_STYLES[ins.severity] || INSIGHT_STYLES.info;
              return (
                <div key={i} className={cn("flex gap-2.5 p-3 rounded-xl border text-sm", style.bg)}>
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", style.icon)} />
                  <span className="leading-relaxed">{ins.text}</span>
                </div>
              );
            })}
          </div>
        )}
        {insights.length === 0 && !narrative && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-sm text-muted-foreground">Add more transactions to unlock AI insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── WEEKLY TREND ──────────────────────────────────────────────
export function WeeklyTrendChart({ weeklyData }) {
  const avg = weeklyData.reduce((s, d) => s + d.amount, 0) / (weeklyData.length || 1);
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-white" />
          </div>
          Weekly Spending Trend
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Weekly average: <span className="font-semibold text-foreground">{fmt(avg)}</span>
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={RED} stopOpacity={0.2} />
                <stop offset="95%" stopColor={RED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avg} stroke={AMBER} strokeDasharray="4 4"
              label={{ value: "avg", position: "insideTopRight", fontSize: 10, fill: AMBER }} />
            <Area type="monotone" dataKey="amount" stroke={RED} strokeWidth={2.5} fill="url(#wkGrad)" name="Spending"
              dot={{ r: 3.5, fill: RED, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5.5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── TOP CATEGORIES ────────────────────────────────────────────
export function TopCategoriesCard({ topCategories }) {
  const max = topCategories[0]?.amount || 1;
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <TrendingDown className="h-3.5 w-3.5 text-white" />
          </div>
          Top 5 Spending Categories
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Your biggest expense areas</p>
      </CardHeader>
      <CardContent>
        {topCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No expense data yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topCategories.map((cat, i) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-muted-foreground w-5 h-5 rounded-lg bg-muted flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold capitalize">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground font-medium">{cat.percentage}%</span>
                    <span className="font-bold tabular-nums">{fmt(cat.amount)}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden ml-7">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(cat.amount / max) * 100}%`, background: PALETTE[i] }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── HEALTH SCORE (radial) ─────────────────────────────────────
export function HealthScoreCard({ data }) {
  const { totalScore, breakdown, tips } = data;
  const color  = totalScore >= 75 ? "#22c55e" : totalScore >= 50 ? "#eab308" : totalScore >= 25 ? "#f97316" : "#ef4444";
  const label  = totalScore >= 75 ? "Excellent" : totalScore >= 50 ? "Good" : totalScore >= 25 ? "Fair" : "Needs Work";
  const circumference = 2 * Math.PI * 54;

  const STATUS_STYLES = {
    excellent: "text-green-500", good: "text-green-500",
    fair: "text-yellow-500", poor: "text-red-500",
    "over budget": "text-red-500", "no budget": "text-muted-foreground",
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Ring */}
      <Card className="border border-border/60 shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(totalScore / 100) * circumference} ${circumference}`}
                className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold tabular-nums" style={{ color }}>{totalScore}</span>
              <span className="text-xs text-muted-foreground font-medium">/ 100</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold" style={{ color }}>{label}</p>
            <p className="text-xs text-muted-foreground mt-1">Based on last 3 months of data</p>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-semibold">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("capitalize font-medium", STATUS_STYLES[item.status] || "text-muted-foreground")}>{item.status}</span>
                  <span className="font-bold">{item.score}<span className="text-muted-foreground font-normal">/{item.max}</span></span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(item.score / item.max) * 100}%`, background: item.score / item.max > 0.6 ? "#22c55e" : item.score / item.max > 0.3 ? "#eab308" : "#ef4444" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TOP MERCHANTS ─────────────────────────────────────────────
export function TopMerchantsCard({ topMerchants }) {
  if (!topMerchants || topMerchants.length === 0) return null;
  const max = topMerchants[0]?.total || 1;

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <ShoppingBag className="h-3.5 w-3.5 text-white" />
          </div>
          AI Expense Breakdown
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Top merchants by total spend</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topMerchants.slice(0, 9).map((m, i) => (
            <div key={m.merchant} className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors border border-border/30">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-sm"
                style={{ background: PALETTE[i % PALETTE.length] }}>
                {(m.merchant || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{m.merchant}</p>
                <p className="text-[10px] text-muted-foreground">{m.count} transaction{m.count !== 1 ? "s" : ""}</p>
                <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(m.total / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums shrink-0">{fmt(m.total)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}