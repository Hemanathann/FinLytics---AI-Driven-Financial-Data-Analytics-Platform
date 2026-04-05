"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { fmt, fmtCompact } from "@/lib/currency-utils";

const P = ["#378ADD","#1D9E75","#EF9F27","#E24B4A","#7F77DD","#D4537E","#5DCAA5","#BA7517","#534AB7","#0F6E56"];

export function DashboardSpendingCharts({ transactions }) {

  // Tooltip using fmt from context
  function Tip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{payload[0].name}</p>
        <p className="text-slate-500 dark:text-slate-400">{fmt(payload[0].value)}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
        <p className="text-xs text-slate-400">Import transactions to see spending charts</p>
      </div>
    );
  }

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recent = transactions.filter(t => new Date(t.date) >= thirtyAgo);

  // Category totals for donut
  const catMap = {};
  recent.filter(t => t.type === "EXPENSE").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
  });
  const catData = Object.entries(catMap)
    .map(([cat, amt]) => ({ name: cat, value: parseFloat(amt.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Daily totals last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    const amount = transactions
      .filter(t => t.type === "EXPENSE" && t.date?.toString().split("T")[0] === dayStr)
      .reduce((s, t) => s + Number(t.amount), 0);
    last7.push({ day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()], amount: parseFloat(amount.toFixed(2)) });
  }

  const totalSpent  = catData.reduce((s, c) => s + c.value, 0);
  const totalIncome = recent.filter(t => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600"/>
            <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">30-day income</p>
          </div>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{fmt(totalIncome)}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-red-500"/>
            <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">30-day spend</p>
          </div>
          <p className="text-xl font-black text-red-600 dark:text-red-400">{fmt(totalSpent)}</p>
        </div>
      </div>

      {/* Donut + legend */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Spending breakdown</p>
          <span className="text-[10px] text-slate-400">Last 30 days</span>
        </div>
        {catData.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No expense transactions in the last 30 days</p>
        ) : (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={2} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={P[i % P.length]}/>)}
                </Pie>
                <Tooltip content={<Tip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1 min-w-0">
              {catData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{background:P[i%P.length]}}/>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate flex-1">{c.name}</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0">{fmt(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7-day bar chart */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily spend this week</p>
          <span className="text-[10px] text-slate-400">Last 7 days</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={last7} margin={{top:0,right:0,left:-30,bottom:0}}>
            <XAxis dataKey="day" tick={{fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:8}} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="amount" name="Spent" radius={[4,4,0,0]} fill="#378ADD">
              {last7.map((d, i) => {
                const max = Math.max(...last7.map(x => x.amount));
                return <Cell key={i} fill={d.amount === max && d.amount > 0 ? "#E24B4A" : "#378ADD"}/>;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Link href="/analytics" className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-blue-600 dark:text-blue-400">
        View full analytics
        <ArrowRight className="h-3.5 w-3.5"/>
      </Link>
    </div>
  );
}