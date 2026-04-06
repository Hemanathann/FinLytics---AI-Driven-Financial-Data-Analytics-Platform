"use client";

import { useState } from "react";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  BarChart2, Wallet, AlertTriangle, CheckCircle2,
  Brain, ShieldCheck, AlertCircle, Lightbulb,
  PieChart as PieIcon, Target, Zap, ArrowUpRight,
  ArrowDownRight, Sparkles, Info, ChevronRight,
} from "lucide-react";
import { trackAnalyticsTabViewed, trackAIInsightsViewed } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";

// ── Palette ──────────────────────────────────────────────────
const P = ["#378ADD","#1D9E75","#EF9F27","#E24B4A","#7F77DD","#D4537E","#5DCAA5","#BA7517","#534AB7","#0F6E56"];
const BLUE  = "#378ADD";
const GREEN = "#1D9E75";
const RED   = "#E24B4A";
const AMBER = "#EF9F27";

// ── Tooltip ───────────────────────────────────────────────────
function makeTip(fmt) {
  return function Tip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-xs min-w-[130px]">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{background:p.color||p.fill}}/>
              <span className="text-slate-500 dark:text-slate-400 capitalize">{p.name}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {typeof p.value==="number" ? fmt(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, icon:Icon, color, bg, trend }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className={cn("h-4 w-4", color)}/>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={cn("text-xl font-black mt-0.5 tracking-tight", color)}>{value}</p>
      {sub && (
        <p className={cn("text-[11px] mt-0.5", trend!=null&&trend>10?"text-red-500":trend!=null&&trend<-10?"text-emerald-500":"text-slate-400")}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, sub, children, action }) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
function Card({ children, className }) {
  return (
    <div className={cn("p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900", className)}>
      {children}
    </div>
  );
}

export function AnalyticsClient({
  data, healthData, anomalyData, forecastData,
  emergencyFundData, costOfLivingData, aiData,
}) {
  const [tab, setTab] = useState("overview");
  const Tip = makeTip(fmt);

  const { stats, monthlySummary, categoryBreakdown, weeklyData, topMerchants, heatmapData, dailySpending } = data || {};
  const top6cats = (categoryBreakdown || []).slice(0, 6);

  // ── Zero state — no transactions yet ──────────────────────────
  if (!data || !stats || stats.transactionCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-4">
          <BarChart2 className="h-8 w-8 text-blue-400"/>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No data to analyse yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Import a bank statement to unlock all analytics — spending trends, anomaly detection, AI insights and more.
        </p>
        <a href="/statement-import"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm">
          Import bank statement
        </a>
      </div>
    );
  }

  const TABS = [
    { id:"overview",  label:"Overview",   icon:BarChart2 },
    { id:"spending",  label:"Spending",   icon:TrendingDown },
    { id:"income",    label:"Income",     icon:TrendingUp },
    { id:"trends",    label:"Trends",     icon:Activity },
    { id:"ai",        label:"AI Insights",icon:Brain },
  ];

  return (
    <div className="mt-6 space-y-6">

      {/* ── STAT STRIP ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Income"   value={fmtCompact(stats.totalIncome)} sub="Last 6 months"  icon={TrendingUp}   color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/60" />
        <StatCard label="Total Expenses" value={fmtCompact(stats.totalExpense)} sub="Last 6 months"  icon={TrendingDown}  color="text-red-500"    bg="bg-red-50 dark:bg-red-950/60" />
        <StatCard label="Net Savings"    value={fmtCompact(stats.netSavings)} sub={`${stats.savingsRate}% rate`} icon={DollarSign} color={stats.netSavings>=0?"text-blue-600 dark:text-blue-400":"text-red-500"} bg="bg-blue-50 dark:bg-blue-950/60" />
        <StatCard label="This Month"     value={`${fmt(stats.thisMonthExpense)}`}       sub={`${stats.monthOverMonthChange>0?"▲":"▼"} ${Math.abs(stats.monthOverMonthChange)}% vs last`} icon={Activity} color={stats.monthOverMonthChange>10?"text-orange-500":"text-emerald-500"} bg="bg-orange-50 dark:bg-orange-950/60" trend={stats.monthOverMonthChange} />
        <StatCard label="Avg / Month"    value={fmtCompact(stats.avgMonthlySpend)} sub="Monthly average" icon={Wallet}     color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/60" />
        <StatCard label="Transactions"   value={stats.transactionCount.toString()}             sub="Last 6 months"   icon={BarChart2}   color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-950/60" />
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => {
            setTab(t.id);
            // GA4: track which analytics tab user views
            trackAnalyticsTabViewed(t.id);
            // GA4: fire extra event specifically when AI insights tab opened
            if (t.id === "ai") trackAIInsightsViewed();
          }}
            className={cn(
              "flex items-center gap-1.5 flex-1 text-xs font-semibold py-2.5 px-3 rounded-xl transition-all whitespace-nowrap justify-center",
              tab===t.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}>
            <t.icon className="h-3.5 w-3.5 shrink-0"/>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════════════════ */}
      {tab==="overview" && (
        <div className="space-y-6">

          {/* ── CHART 1: Income vs Expenses ─────────────────────── */}
          {/* MOST IMPORTANT: shows if you earn more than you spend */}
          <Card>
            <p className="text-sm font-bold">Income vs Expenses — Last 6 Months</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">
              Green bars = money earned · Red bars = money spent · Aim for green taller than red
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySummary || []} margin={{top:5,right:5,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v.split(" ")[0]}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                <Tooltip content={<Tip/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="income"  name="Income"  fill={GREEN} radius={[4,4,0,0]}/>
                <Bar dataKey="expense" name="Expense" fill={RED}   radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 mt-3 pt-3 border-t flex-wrap">
              {monthlySummary.slice(-1).map(m=>[
                {l:"Last month income",  v:`${fmt(m.income)}`,  c:"text-emerald-600 dark:text-emerald-400"},
                {l:"Last month expenses",v:`${fmt(m.expense)}`, c:"text-red-500"},
                {l:"Net savings",        v:`${m.net>=0?"+":""}${fmt(m.net)}`, c:m.net>=0?"text-blue-600 dark:text-blue-400":"text-red-500"},
              ].map(s=>(
                <div key={s.l}>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                  <p className={cn("text-sm font-black",s.c)}>{s.v}</p>
                </div>
              )))}
            </div>
          </Card>

          {/* ── CHART 2: Where money goes + savings trend ───────── */}
          {/* SECOND: spending breakdown and whether you're saving */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <p className="text-sm font-bold">Where Your Money Goes</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Bigger slice = higher spending in that category</p>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={145} height={145}>
                  <PieChart>
                    <Pie data={top6cats} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={3} dataKey="amount">
                      {(top6cats||[]).map((_,i)=><Cell key={i} fill={P[i%P.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v)=>[fmt(Number(v)),"Amount"]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1 min-w-0">
                  {top6cats.map((cat,i)=>(
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:P[i%P.length]}}/>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 capitalize truncate flex-1">{cat.category}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-sm font-bold">Monthly Savings</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Above the line = saved money · Below = overspent</p>
              <ResponsiveContainer width="100%" height={165}>
                <AreaChart data={monthlySummary || []} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BLUE} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={BLUE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v.split(" ")[0]}/>
                  <YAxis tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 2"/>
                  <Area type="monotone" dataKey="net" name="Net Savings" stroke={BLUE} strokeWidth={2.5} fill="url(#netGrad)" dot={{r:4,fill:BLUE}} activeDot={{r:6}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ── CHART 3: Health Score ────────────────────────────── */}
          {/* Needs context to understand — placed after simpler charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-sm font-bold">Financial Health Score</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">0–100 based on savings rate, budget and spending patterns</p>
              {(()=>{
                const score = healthData.totalScore;
                const col = score>=75?"#1D9E75":score>=50?"#EF9F27":score>=25?"#f97316":"#E24B4A";
                const lbl = score>=75?"Excellent":score>=50?"Good":score>=25?"Fair":"Needs Work";
                const circ = 2*Math.PI*44;
                return (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="8" className="stroke-slate-100 dark:stroke-slate-800"/>
                        <circle cx="50" cy="50" r="44" fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${(score/100)*circ} ${circ}`}/>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black" style={{color:col}}>{score}</span>
                        <span className="text-[10px] text-slate-400">/ 100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-lg" style={{color:col}}>{lbl}</p>
                      <p className="text-xs text-slate-400">Based on last 3 months</p>
                    </div>
                    <div className="w-full space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {healthData.breakdown?.map(b=>(
                        <div key={b.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500">{b.label}</span>
                            <span className="font-semibold">{b.score}/{b.max}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{width:`${(b.score/b.max)*100}%`,background:b.score/b.max>0.6?GREEN:b.score/b.max>0.3?AMBER:RED}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card className="lg:col-span-2">
              <p className="text-sm font-bold">Score Breakdown — What Affects Your Score</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4">Improve these areas to raise your financial health score</p>
              {healthData.tips?.length > 0 && (
                <ul className="space-y-3">
                  {healthData.tips.slice(0,5).map((tip,i)=>(
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">{i+1}</span>
                      <span className="text-muted-foreground leading-relaxed text-xs">{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* ── ANOMALY ALERTS ──────────────────────────────────── */}
          {anomalyData.anomalies?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500"/>
                <p className="text-sm font-bold">Unusual Spending Detected</p>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold ml-auto">{anomalyData.anomalies.length} alerts</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">These categories had significantly higher spending than your usual pattern</p>
              <div className="space-y-2">
                {anomalyData.anomalies.slice(0,3).map((a,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold capitalize">{a.category}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</p>
                    </div>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 shrink-0">{fmt(Number(a.amount||0))}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab==="spending" && (
        <div className="space-y-6">

          {/* 50/30/20 Rule checker */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-blue-500"/>
              <p className="text-sm font-bold">50/30/20 Budget Rule</p>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">How are you doing?</span>
            </div>
            {(() => {
              const income = stats.totalIncome / 6;
              const needs = ["housing","utilities","groceries","transportation","healthcare","insurance","bills"];
              const wants = ["food","entertainment","shopping","personal","travel"];
              const needsAmt = categoryBreakdown.filter(c=>needs.includes(c.category)).reduce((s,c)=>s+c.amount/6,0);
              const wantsAmt = categoryBreakdown.filter(c=>wants.includes(c.category)).reduce((s,c)=>s+c.amount/6,0);
              const savingsAmt = Math.max(0, income - (stats.avgMonthlySpend));
              const buckets = [
                {label:"Needs (50%)",   target:50, actual:income>0?((needsAmt/income)*100):0, amount:needsAmt, color:BLUE,  ideal:"Housing, utilities, groceries, transport"},
                {label:"Wants (30%)",   target:30, actual:income>0?((wantsAmt/income)*100):0, amount:wantsAmt, color:AMBER, ideal:"Food out, entertainment, shopping, travel"},
                {label:"Savings (20%)", target:20, actual:income>0?((savingsAmt/income)*100):0, amount:savingsAmt, color:GREEN, ideal:"Emergency fund, investments, goals"},
              ];
              return (
                <div className="space-y-4">
                  {buckets.map(b => {
                    const pct = Math.min(b.actual, 100);
                    const over = b.actual > b.target;
                    const ok   = Math.abs(b.actual - b.target) <= 5;
                    return (
                      <div key={b.label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{b.label}</span>
                            <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                              ok?"bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300":
                              over?"bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300":
                              "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300")}>
                              {ok?"On track":over?"Over target":"Under target"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{fmt(b.amount)}/mo</span>
                            <span className="font-black text-slate-700 dark:text-slate-300">{b.actual.toFixed(0)}%</span>
                            <span className="text-slate-300 dark:text-slate-600">target {b.target}%</span>
                          </div>
                        </div>
                        <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{width:`${pct}%`,background:ok?GREEN:over?RED:AMBER}}/>
                          <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-400"
                            style={{left:`${b.target}%`}}/>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.ideal}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Card>

          {/* Category breakdown bar */}
          <Card>
            <p className="text-sm font-bold mb-4">Expenses by Category</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryBreakdown.slice(0,10)} layout="vertical" margin={{top:0,right:60,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                <YAxis type="category" dataKey="category" tick={{fontSize:11}} width={90} tickFormatter={v=>v.charAt(0).toUpperCase()+v.slice(1)}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="amount" name="Amount" radius={[0,4,4,0]}>
                  {categoryBreakdown.slice(0,10).map((_,i)=><Cell key={i} fill={P[i%P.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Top merchants */}
          <Card>
            <p className="text-sm font-bold mb-4">Top Merchants by Spend</p>
            <div className="space-y-2">
              {topMerchants.slice(0,8).map((m, i) => {
                const maxAmt = topMerchants[0]?.total || 1;
                return (
                  <div key={m.merchant} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{background:P[i%P.length]}}>
                      {(m.merchant||"?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold truncate capitalize">{m.merchant}</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 shrink-0 ml-2">{fmt(m.total)}</p>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${(m.total/maxAmt)*100}%`,background:P[i%P.length]}}/>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{m.count}×</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Daily spend last 30 days */}
          <Card>
            <p className="text-sm font-bold mb-4">Daily Spending — Last 30 Days</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={(dailySpending || []).slice(-30)} margin={{top:5,right:5,left:-20,bottom:0}}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={RED} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={RED} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize:9}} tickFormatter={v=>v} interval={6}/>
                <YAxis tick={{fontSize:9}} tickFormatter={v=>fmtCompact(v)}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="amount" name="Spent" stroke={RED} strokeWidth={2} fill="url(#dailyGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: INCOME
      ════════════════════════════════════════════════════════ */}
      {tab==="income" && (
        <div className="space-y-6">

          {/* Income summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {label:"Total Income (6mo)",    value:`${fmt(stats.totalIncome)}`,      color:"text-emerald-600",  bg:"bg-emerald-50 dark:bg-emerald-950/60"},
              {label:"Average Monthly",       value:`${fmt(stats.totalIncome/6)}`,  color:"text-blue-600 dark:text-blue-400",     bg:"bg-blue-50 dark:bg-blue-950/60"},
              {label:"Savings Rate",          value:`${stats.savingsRate}%`,                 color:stats.savingsRate>=20?"text-emerald-600":"text-amber-600", bg:stats.savingsRate>=20?"bg-emerald-50 dark:bg-emerald-950/60":"bg-amber-50 dark:bg-amber-950/60"},
            ].map(s=>(
              <div key={s.label} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly income line */}
          <Card>
            <p className="text-sm font-bold mb-4">Monthly Income History</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlySummary || []} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v.split(" ")[0]}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                <Tooltip content={<Tip/>}/>
                <Line type="monotone" dataKey="income" name="Income" stroke={GREEN} strokeWidth={2.5} dot={{r:5,fill:GREEN}} activeDot={{r:7}}/>
                <Line type="monotone" dataKey="expense" name="Expense" stroke={RED} strokeWidth={2} strokeDasharray="4 2" dot={{r:4,fill:RED}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Income sources from categories */}
          <Card>
            <p className="text-sm font-bold mb-4">Income by Source</p>
            {(() => {
              const incomeCats = data.categoryBreakdown.filter(c=>
                ["salary","freelance","investments","business","rental","other-income"].includes(c.category)
              );
              if (!incomeCats.length) {
                return <p className="text-sm text-slate-400 text-center py-6">Import more transactions to see income breakdown</p>;
              }
              return (
                <div className="space-y-3">
                  {incomeCats.map((c,i)=>(
                    <div key={c.category} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0"
                        style={{background:P[i%P.length]}}>
                        {c.category.slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{c.category}</span>
                          <span className="font-black">{fmt(c.amount)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${c.percentage}%`,background:P[i%P.length]}}/>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>

          {/* Savings target */}
          {aiData.savingsTarget > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-blue-500"/>
                <p className="text-sm font-bold">20% Savings Target</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {l:"Monthly Income",   v:`${fmt(stats.totalIncome/6)}`, c:"text-slate-700 dark:text-slate-300"},
                  {l:"20% Target",       v:`${fmt(aiData.savingsTarget)}`,  c:"text-blue-600 dark:text-blue-400"},
                  {l:"Actual Savings",   v:`${fmt(stats.netSavings/6)}`,  c:stats.netSavings/6>=aiData.savingsTarget?"text-emerald-600":"text-red-500"},
                ].map(s=>(
                  <div key={s.l} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 mb-1">{s.l}</p>
                    <p className={cn("text-lg font-black", s.c)}>{s.v}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: TRENDS
      ════════════════════════════════════════════════════════ */}
      {tab==="trends" && (
        <div className="space-y-6">

          {/* Weekly spending */}
          <Card>
            <p className="text-sm font-bold mb-1">Weekly Spending — Last 8 Weeks</p>
            <p className="text-xs text-slate-400 mb-4">Spot patterns and high-spend weeks at a glance</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData || []} margin={{top:5,right:5,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                <XAxis dataKey="week" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                <Tooltip content={<Tip/>}/>
                <Bar dataKey="amount" name="Spent" fill={BLUE} radius={[4,4,0,0]}>
                  {weeklyData.map((w,i)=>{
                    const max = Math.max(...weeklyData.map(x=>x.amount));
                    return <Cell key={i} fill={w.amount===max?RED:BLUE}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Spending forecast */}
          {forecastData?.forecast?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-violet-500"/>
                <p className="text-sm font-bold">Spending Forecast — Next 3 Months</p>
              </div>
              <p className="text-xs text-slate-400 mb-4">Linear regression based on your 6-month pattern</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[...monthlySummary, ...forecastData.forecast]} margin={{top:5,right:5,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10}} tickFormatter={v=>v.split(" ")[0]}/>
                  <YAxis tick={{fontSize:10}} tickFormatter={v=>fmtCompact(v)}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine x={monthlySummary[monthlySummary.length-1]?.month} stroke="#e2e8f0" strokeDasharray="4 2" label={{value:"Today",position:"insideTopRight",fontSize:10,fill:"#94a3b8"}}/>
                  <Area type="monotone" dataKey="expense" name="Actual" stroke={RED}   strokeWidth={2.5} fill="none" dot={{r:4,fill:RED}}/>
                  <Area type="monotone" dataKey="predicted" name="Forecast" stroke="#7F77DD" strokeWidth={2} strokeDasharray="4 3" fill="url(#forecastGrad)" dot={{r:4,fill:"#7F77DD"}}/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Spending heatmap */}
          <Card>
            <p className="text-sm font-bold mb-1">Spending Calendar — Last 12 Weeks</p>
            <p className="text-xs text-slate-400 mb-4">Darker = more spending that day</p>
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {(() => {
                  const weeks = [];
                  const days = heatmapData || [];
                  const maxAmt = Math.max(...days.map(d=>d.amount), 1);
                  for (let w=0; w<12; w++) {
                    const chunk = days.slice(w*7, (w+1)*7);
                    weeks.push(
                      <div key={w} className="flex flex-col gap-1">
                        {chunk.map((d,i)=>(
                          <div key={i} title={`${d.date}: ${fmt(d.amount)}`}
                            className="w-7 h-7 rounded-md transition-colors"
                            style={{background:d.amount===0?"rgb(241,245,249)":
                              `rgba(55,138,221,${Math.min(0.9,(d.amount/maxAmt)*1.2+0.1)})`}}/>
                        ))}
                      </div>
                    );
                  }
                  return weeks;
                })()}
              </div>
            </div>
          </Card>

          {/* Month over month change */}
          <Card>
            <p className="text-sm font-bold mb-4">Month-over-Month Expense Change</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={(monthlySummary || []).slice(1).map((m,i)=>{
                  const prev = monthlySummary[i];
                  const change = prev.expense > 0 ? ((m.expense-prev.expense)/prev.expense)*100 : 0;
                  return {month:m.month.split(" ")[0], change:parseFloat(change.toFixed(1))};
                })}
                margin={{top:5,right:5,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226,232,240)" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10}}/>
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <Tooltip formatter={(v)=>[`${v}%`,"Change"]}/>
                <ReferenceLine y={0} stroke="#e2e8f0"/>
                <Bar dataKey="change" name="Change %" radius={[4,4,0,0]}>
                  {monthlySummary.slice(1).map((_,i)=>{
                    const prev = monthlySummary[i];
                    const change = prev.expense > 0 ? ((monthlySummary[i+1]?.expense-prev.expense)/prev.expense)*100 : 0;
                    return <Cell key={i} fill={change>0?RED:GREEN}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: AI INSIGHTS
      ════════════════════════════════════════════════════════ */}
      {tab==="ai" && (
        <div className="space-y-5">

          {/* AI Narrative */}
          {aiData.insightNarrative && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white"/>
                </div>
                <div>
                  <p className="text-sm font-bold">AI Financial Narrative</p>
                  <p className="text-[11px] text-slate-400">Powered by Groq · Llama 3.3</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-teal-400 animate-pulse"/>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-blue-500 pl-4 py-1">
                {aiData.insightNarrative}
              </p>
            </Card>
          )}

          {/* Rule-based insights */}
          {aiData.insights?.length > 0 && (
            <Card>
              <p className="text-sm font-bold mb-4">Key Observations</p>
              <div className="space-y-3">
                {aiData.insights.map((insight, i) => {
                  const isWarn = insight.severity === "warning";
                  const isOk   = insight.severity === "success";
                  return (
                    <div key={i} className={cn("flex gap-3 p-3 rounded-xl",
                      isWarn?"bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900":
                      isOk  ?"bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900":
                      "bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900")}>
                      {isWarn ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
                               :isOk ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                               :<Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5"/>}
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{insight.text}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Saving suggestions */}
          {aiData.suggestions?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-4 w-4 text-amber-500"/>
                <p className="text-sm font-bold">Saving Suggestions</p>
                {aiData.totalPotentialSavings > 0 && (
                  <span className="ml-auto text-xs font-black text-emerald-600 dark:text-emerald-400">
                    Save up to {fmt(aiData.totalPotentialSavings)}/mo
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {aiData.suggestions.slice(0,6).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-lg shrink-0">{s.icon||"💡"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{s.suggestion}</p>
                    </div>
                    {s.saving > 0 && (
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                        +${s.saving.toFixed(0)}/mo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Budget recommendations */}
          {aiData.recommendations?.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-violet-500"/>
                <p className="text-sm font-bold">Smart Budget Recommendations</p>
              </div>
              {aiData.budgetNarrative && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{aiData.budgetNarrative}</p>
              )}
              <div className="space-y-2">
                {aiData.recommendations.slice(0,6).map((r,i) => {
                  const over = r.status === "over";
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{background:P[i%P.length]+"20",color:P[i%P.length]}}>
                        {(r.category||"?").slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">{r.category}</p>
                        <p className="text-[10px] text-slate-400">Current: ${r.current?.toFixed(0)} · Recommended: ${r.recommended?.toFixed(0)}</p>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0",
                        over?"bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300":
                        r.status==="optimal"?"bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300":
                        "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>
                        {over?"Over":"Optimal"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Emergency fund */}
          {emergencyFundData && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-blue-500"/>
                <p className="text-sm font-bold">Emergency Fund Status</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  {l:"Current fund",  v:`${fmt(emergencyFundData.currentSavings||0)}`,    c:"text-slate-700 dark:text-slate-300"},
                  {l:"Target (3mo)", v:`${fmt(emergencyFundData.targetAmount||0)}`,       c:"text-blue-600 dark:text-blue-400"},
                  {l:"Months covered",v:`${(emergencyFundData.monthsCovered||0).toFixed(1)}mo`,    c:emergencyFundData.monthsCovered>=3?"text-emerald-600":"text-red-500"},
                ].map(s=>(
                  <div key={s.l} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 mb-1">{s.l}</p>
                    <p className={cn("text-base font-black",s.c)}>{s.v}</p>
                  </div>
                ))}
              </div>
              {emergencyFundData.monthsCovered < 3 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0"/>
                  Aim for 3–6 months of expenses. Save ${((emergencyFundData.targetAmount||0)-(emergencyFundData.currentSavings||0)).toFixed(0)} more to reach the minimum target.
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}