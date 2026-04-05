"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie,
} from "recharts";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, Lightbulb,
  TrendingDown, Target, BarChart3, Sun, Moon, ArrowRight,
  Home, Utensils, Car, Zap, MoreHorizontal, Sparkles,
  CheckCircle2, AlertTriangle, Info, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/currency-utils";

function Tooltip2({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-xl shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-muted-foreground capitalize">{p.name}</span>
          </span>
          <span className="font-medium">{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  EMERGENCY FUND CALCULATOR
// ══════════════════════════════════════════════════════════════
const EF_CONFIG = {
  green: { icon: ShieldCheck, bg: "bg-green-50 dark:bg-green-950", iconColor: "text-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  blue:  { icon: Shield,      bg: "bg-blue-50 dark:bg-blue-950",   iconColor: "text-blue-500",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  amber: { icon: ShieldAlert, bg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  red:   { icon: ShieldX,     bg: "bg-red-50 dark:bg-red-950",     iconColor: "text-red-500",   badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export function EmergencyFundCard({ data }) {
  const cfg = EF_CONFIG[data.statusColor] || EF_CONFIG.blue;
  const Icon = cfg.icon;
  const coverage = Math.min(data.currentCoverage, 6);
  const segments = [
    { label: "Current", value: data.totalSavings, fill: "#6366f1" },
    { label: "3-Mo Target", value: data.recommended3Mo, fill: "#22c55e" },
    { label: "6-Mo Target", value: data.recommended6Mo, fill: "#3b82f6" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Emergency Fund
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">3–6 months of expenses recommended</p>
          </div>
          <Badge className={cn("text-xs font-semibold", cfg.badge)}>{data.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage gauge */}
        <div className={cn("rounded-2xl p-4 flex items-center gap-4", cfg.bg)}>
          <Icon className={cn("h-10 w-10 shrink-0", cfg.iconColor)} />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black">{data.currentCoverage} <span className="text-sm font-normal text-muted-foreground">months covered</span></p>
            <div className="mt-2 h-2.5 bg-background/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(coverage / 6) * 100}%`, background: cfg.iconColor.replace("text-", "").includes("green") ? "#22c55e" : cfg.iconColor.replace("text-", "").includes("blue") ? "#3b82f6" : cfg.iconColor.replace("text-", "").includes("amber") ? "#f59e0b" : "#ef4444" }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span><span>3 mo</span><span>6 mo</span>
            </div>
          </div>
        </div>

        {/* 3 target cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Current Savings", val: data.totalSavings, col: "text-indigo-500" },
            { label: "3-Month Target", val: data.recommended3Mo, col: "text-green-500" },
            { label: "6-Month Target", val: data.recommended6Mo, col: "text-blue-500" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-muted/40 text-center">
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{s.label}</p>
              <p className={cn("text-sm font-bold", s.col)}>{fmt(s.val)}</p>
            </div>
          ))}
        </div>

        {/* Advice */}
        <div className="p-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground flex gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
          <span>{data.advice}</span>
        </div>

        {/* Monthly contributions needed */}
        {data.shortfall3Mo > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Save <span className="font-semibold text-foreground">{fmt(data.monthlyToReach3Mo)}/mo</span> to reach 3-month fund in 6 months</span>
          </div>
        )}

        {/* Monthly expense breakdown */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Monthly expense breakdown</p>
          <div className="space-y-1.5">
            {data.topExpenses.map((e, i) => (
              <div key={e.category} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ["#6366f1","#22c55e","#f59e0b","#ef4444"][i] }} />
                <span className="capitalize text-muted-foreground flex-1">{e.category}</span>
                <span className="font-medium">{fmt(e.monthly)}/mo</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-1.5 border-t">
              <span className="font-semibold">Total monthly expenses</span>
              <span className="font-bold">{fmt(data.avgMonthlyExpense)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  AI SAVING SUGGESTIONS
// ══════════════════════════════════════════════════════════════
const SUGGESTION_ICONS = { "🍔": "food", "🎬": "entertainment", "🛍️": "shopping", "🚗": "transport", "💡": "ai" };
const TYPE_COLORS = { reduce: "#ef4444", optimise: "#f59e0b", ai: "#6366f1" };

export function AISavingSuggestionsCard({ data }) {
  const { suggestions, totalPotentialSavings, message } = data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Saving Suggestions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Personalised recommendations from your spending</p>
          </div>
          {totalPotentialSavings > 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-muted-foreground">Potential savings</p>
              <p className="text-lg font-black text-green-600">{fmt(totalPotentialSavings)}<span className="text-xs font-normal">/mo</span></p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {message ? (
          <div className="text-center py-8">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((sg, i) => (
              <div key={i} className="flex gap-3 p-3.5 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="text-2xl shrink-0 mt-0.5">{sg.icon || "💡"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{sg.suggestion}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-2 py-0 capitalize">{sg.category}</Badge>
                    {sg.type && (
                      <span className="text-[10px] font-semibold capitalize" style={{ color: TYPE_COLORS[sg.type] || "#6366f1" }}>
                        {sg.type === "ai" ? "✨ AI tip" : sg.type}
                      </span>
                    )}
                  </div>
                </div>
                {sg.saving > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">+{fmt(sg.saving)}</p>
                    <p className="text-[10px] text-muted-foreground">/month</p>
                  </div>
                )}
              </div>
            ))}

            {/* Annual projection */}
            {totalPotentialSavings > 0 && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-100 dark:border-green-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Annual saving potential</span>
                </div>
                <span className="text-xl font-black text-green-600">{fmt(totalPotentialSavings * 12)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  SMART BUDGET RECOMMENDATION
// ══════════════════════════════════════════════════════════════
const CAT_ICONS = { housing: Home, food: Utensils, groceries: Utensils, transportation: Car, utilities: Zap };
const STATUS_CFG2 = {
  over:    { label: "Over recommended", col: "text-red-500",   badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  under:   { label: "Under budget",     col: "text-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  optimal: { label: "Optimal",          col: "text-blue-500",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

export function SmartBudgetCard({ data }) {
  const { recommendations, avgMonthlyIncome, savingsTarget, narrative, message } = data;

  if (message) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Smart Budget Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
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
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Smart Budget Recommendation
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Based on 50/30/20 rule + your spending history</p>
          </div>
          {avgMonthlyIncome > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Monthly income</p>
              <p className="text-base font-bold">{fmt(avgMonthlyIncome)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI narrative */}
        {narrative && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-100 dark:border-indigo-900">
            <div className="flex gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{narrative}</p>
            </div>
          </div>
        )}

        {/* Savings target highlight */}
        {savingsTarget > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Recommended monthly savings (20%)</span>
            </div>
            <span className="text-lg font-bold text-green-600">{fmt(savingsTarget)}</span>
          </div>
        )}

        {/* Per-category recommendations */}
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => {
            const Icon = CAT_ICONS[rec.category] || MoreHorizontal;
            const scfg = STATUS_CFG2[rec.status] || STATUS_CFG2.optimal;
            const barPct = Math.min((rec.current / Math.max(rec.recommended * 1.3, rec.current)) * 100, 100);
            const recPct = Math.min((rec.recommended / Math.max(rec.recommended * 1.3, rec.current)) * 100, 100);

            return (
              <div key={rec.category} className="p-3 rounded-xl border bg-muted/30">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{rec.category}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize">{rec.type}</Badge>
                  </div>
                  <Badge className={cn("text-[9px] px-2 py-0", scfg.badge)}>{scfg.label}</Badge>
                </div>
                <div className="flex items-end gap-3 text-xs">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1 text-[10px] text-muted-foreground">
                      <span>Current: <span className="font-semibold text-foreground">{fmt(rec.current)}</span></span>
                      <span>Rec: <span className="font-semibold text-foreground">{fmt(rec.recommended)}</span></span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div className="absolute h-full rounded-full bg-muted-foreground/20"
                        style={{ width: `${recPct}%` }} />
                      <div className="absolute h-full rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%`, background: rec.status === "over" ? "#ef4444" : rec.status === "optimal" ? "#22c55e" : "#3b82f6" }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  COST OF LIVING TRACKER
// ══════════════════════════════════════════════════════════════
const COL_COLORS = { housing: "#6366f1", food: "#22c55e", transport: "#f59e0b", utilities: "#3b82f6", other: "#94a3b8" };

export function CostOfLivingCard({ data }) {
  const { months, currentMonth, momChange, weekdaySpend, weekendSpend, avgWeekday, avgWeekend, weekendIsHigher } = data;

  const weekData = [
    { name: "Weekdays", amount: weekdaySpend, avg: avgWeekday, fill: "#6366f1" },
    { name: "Weekends", amount: weekendSpend, avg: avgWeekend, fill: "#f59e0b" },
  ];

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Home className="h-4 w-4 text-purple-500" />
              Cost of Living Tracker
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">6-month breakdown by life category</p>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold",
            momChange > 5 ? "bg-red-50 text-red-600 dark:bg-red-950" : momChange < -5 ? "bg-green-50 text-green-600 dark:bg-green-950" : "bg-muted text-muted-foreground"
          )}>
            {momChange > 0 ? "▲" : momChange < 0 ? "▼" : "—"} {Math.abs(momChange)}% vs last month
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stacked area chart */}
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={months} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              {Object.entries(COL_COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`} />
            <Tooltip content={<Tooltip2 />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {Object.entries(COL_COLORS).map(([key, color]) => (
              <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={color} fill={`url(#grad-${key})`} name={key.charAt(0).toUpperCase() + key.slice(1)} />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Current month summary tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(COL_COLORS).map(([key, color]) => (
            <div key={key} className="p-3 rounded-xl border text-center" style={{ borderColor: color + "40" }}>
              <p className="text-[10px] text-muted-foreground capitalize mb-1">{key}</p>
              <p className="text-sm font-bold" style={{ color }}>{fmt(currentMonth?.[key] || 0)}</p>
            </div>
          ))}
        </div>

        {/* Weekend vs Weekday */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Sun className="h-3.5 w-3.5" />Weekend vs Weekday spending (last 30 days)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              {weekData.map((w) => (
                <div key={w.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2">
                    {w.name === "Weekdays" ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-muted-foreground">avg {fmt(w.avg)}/day</p>
                    </div>
                  </div>
                  <p className="text-base font-bold">{fmt(w.amount)}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<Tooltip2 />} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {weekData.map((w, i) => <Cell key={i} fill={w.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {weekendIsHigher && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              You spend more on weekends (avg {fmt(avgWeekend)}/day vs {fmt(avgWeekday)}/day on weekdays)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}