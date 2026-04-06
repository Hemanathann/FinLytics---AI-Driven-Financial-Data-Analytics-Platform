import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  Brain, BarChart3, Shield, Repeat2, Target, Globe,
  Zap, ArrowRight, TrendingUp, Sparkles, Lock, Clock,
  FileText, BarChart2, PieChart, Activity, Send,
} from "lucide-react";

const FEATURES = [
  { icon:Brain,     color:"#378ADD", title:"Groq AI Insights",     desc:"Natural language explanations of spending patterns. Get a personalised financial narrative every visit." },
  { icon:BarChart3, color:"#1D9E75", title:"10+ Analytics Charts",  desc:"Health score, anomaly detection, forecasting, heatmaps, category breakdowns and weekly trends." },
  { icon:FileText,  color:"#EF9F27", title:"Smart Bank Import",     desc:"Upload CSV from any bank. 1,145+ merchant keywords categorise every transaction in milliseconds." },
  { icon:Repeat2,   color:"#D4537E", title:"Subscription Tracker",  desc:"Auto-detect Netflix, Spotify, Hotstar, Disney+ and 25+ streaming services from your transaction history." },
  { icon:Shield,    color:"#E24B4A", title:"Insurance Manager",     desc:"Track policies, premiums and renewal dates across India, Ireland, UK and US providers." },
  { icon:Target,    color:"#7F77DD", title:"Savings Goals",         desc:"Create goals with deadlines. Get monthly targets and on-track indicators automatically." },
  { icon:Globe,     color:"#5DCAA5", title:"4 Currencies",          desc:"USD, INR, EUR and GBP. Live exchange rates. Set currency per account when you create it." },
  { icon:Zap,       color:"#BA7517", title:"Anomaly Detection",     desc:"Z-score statistical alerts flag unusual spending spikes before they become a real problem." },
];

const HOW = [
  { n:"01", t:"Create your accounts",   d:"Add your bank accounts — current, savings, investment. Each with its own currency: EUR for Ireland, INR for India, USD/GBP for US/UK." },
  { n:"02", t:"Import your statement",  d:"Download a CSV from your bank portal. FinLytics parses 1,145+ merchant keywords and categorises every transaction instantly — no AI quota needed." },
  { n:"03", t:"Get analytics insights", d:"Groq AI writes a personalised financial narrative. Charts, health scores and forecasts update in real time with your actual data." },
];

const STATS = [
  {v:"1,145+", l:"Merchant keywords"},
  {v:"18",     l:"Spending categories"},
  {v:"10+",    l:"Analytics charts"},
  {v:"4",      l:"Currencies"},
];

const TRUST = [
  {icon:Lock,     t:"Clerk Auth",    s:"Secure sign-in"},
  {icon:Globe,    t:"Global banks",  s:"IE · IN · GB · US"},
  {icon:Activity, t:"Real-time",     s:"Instant categorisation"},
  {icon:Brain,    t:"Groq AI",       s:"Llama 3.3 powered"},
];

function LogoMark({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="#0C1F3F"/>
      <rect x="5"  y="22" width="5" height="9"  rx="1.5" fill="#378ADD"/>
      <rect x="13" y="16" width="5" height="15" rx="1.5" fill="#85B7EB"/>
      <rect x="21" y="10" width="5" height="21" rx="1.5" fill="#378ADD"/>
      <polyline points="7.5,21 15.5,14 23.5,8 31,5" fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="31" cy="5" r="2.5" fill="#5DCAA5"/>
      <rect x="27" y="24" width="8" height="8" rx="2" fill="#185FA5"/>
      <text x="31" y="30.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#B5D4F4" fontFamily="monospace">fx</text>
    </svg>
  );
}

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
            style={{backgroundImage:"radial-gradient(circle, #1d4ed8 1px, transparent 1px)",backgroundSize:"32px 32px"}}/>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-3xl opacity-[0.06] dark:opacity-[0.10]"
            style={{background:"radial-gradient(ellipse, #378ADD 0%, #1D9E75 50%, transparent 80%)"}}/>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.04] dark:opacity-[0.08] bg-teal-400"/>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 mb-10 shadow-sm">
            <LogoMark size={28}/>
            <span className="text-base font-black tracking-tight">
              <span className="text-blue-600 dark:text-blue-400">Fin</span>
              <span className="text-slate-900 dark:text-white">Lytics</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 mx-1">·</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Finance · Data · Analytics</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[96px] font-black leading-[0.92] tracking-tight mb-7">
            <span className="text-slate-900 dark:text-white">Your finances,</span>
            <br/>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-blue-500 bg-clip-text text-transparent">
                analytically.
              </span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-3 leading-relaxed">
            FinLytics turns your bank statement into a full analytics dashboard —
            AI categorisation, anomaly detection, spending forecasts and Groq-powered insights,
            all in one place.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-10">
            Built for Ireland · India · UK · US · 4 currencies · Any bank
          </p>

          {isSignedIn ? (
            <div className="flex flex-wrap gap-3 justify-center mb-16">
              <Link href="/dashboard">
                <button className="flex items-center gap-2.5 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white font-black px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] text-base shadow-2xl shadow-blue-500/25">
                  <BarChart2 className="h-5 w-5"/>
                  Open my dashboard
                  <ArrowRight className="h-5 w-5"/>
                </button>
              </Link>
              <Link href="/analytics">
                <button className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-7 py-4 rounded-2xl transition-all text-base border border-slate-200 dark:border-slate-700">
                  <PieChart className="h-5 w-5"/>
                  View analytics
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center mb-16">
              <Link href="/sign-up">
                <button className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white font-black px-8 py-4 rounded-2xl transition-all hover:scale-[1.02] text-base shadow-2xl shadow-blue-500/25">
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform"/>
                  Analyse my finances
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform"/>
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-7 py-4 rounded-2xl transition-all text-base border border-slate-200 dark:border-slate-700 shadow-sm">
                  Sign in
                </button>
              </Link>
            </div>
          )}

          <div className="relative mx-auto max-w-4xl">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-[#09090B] to-transparent z-10 pointer-events-none"/>
            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/8 dark:shadow-black/60">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex gap-1.5">{["#ef4444","#f59e0b","#22c55e"].map(c=><div key={c} className="w-3 h-3 rounded-full" style={{background:c}}/>)}</div>
                <div className="flex items-center gap-2 flex-1 bg-white dark:bg-slate-800 rounded-lg py-1 px-3 mx-8">
                  <div className="w-3 h-3 rounded-full bg-teal-500/30"/>
                  <span className="text-xs text-slate-400">finlytics.app/dashboard</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#0D0D12] p-4 sm:p-5 space-y-3">
                <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{background:"linear-gradient(135deg, #0C1F3F 0%, #0F3460 50%, #0C1F3F 100%)"}}>
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 85% 50%, #5DCAA5 1px, transparent 1px)",backgroundSize:"18px 18px"}}/>
                  <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-0.5">Total Balance · FinLytics</p>
                      <p className="text-3xl font-black">€24,582.00</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-emerald-300 flex items-center gap-1"><span>↑</span> €4,250 income</span>
                        <span className="text-xs text-red-300 flex items-center gap-1"><span>↓</span> €1,842 spent</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {[["€","EUR",true],["$","USD",false],["₹","INR",false],["£","GBP",false]].map(([sym,code,active])=>(
                        <div key={code} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold ${active?"bg-teal-500 text-white":"bg-white/10 text-white/60"}`}>{sym} {code}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {l:"Net Worth",     v:"€127K",   g:"#0C1F3F", t:"#378ADD"},
                    {l:"Budget",        v:"68% used", g:"#1A0035", t:"#7F77DD"},
                    {l:"Subscriptions", v:"€63/mo",   g:"#1A0800", t:"#EF9F27"},
                    {l:"Health Score",  v:"82/100",   g:"#001A0D", t:"#1D9E75"},
                  ].map(s=>(
                    <div key={s.l} className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                      <div className="w-6 h-6 rounded-lg mb-2" style={{background:s.g}}/>
                      <p className="text-[9px] uppercase tracking-wide" style={{color:s.t+"99"}}>{s.l}</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5" style={{color:s.t}}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1">
                  {["Overview","Transactions","Subscriptions","Insurance","Goals"].map((t,i)=>(
                    <div key={t} className={`flex-1 text-[9px] py-2 rounded-lg text-center font-semibold ${i===0?"bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm":"text-slate-400"}`}>{t}</div>
                  ))}
                </div>
                <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/40 overflow-hidden">
                  {[
                    {d:"Salary ACME Technologies",  c:"salary",       a:"+€4,250",  col:"#1D9E75"},
                    {d:"Netflix.com",               c:"entertainment", a:"-€15.99",  col:"#E24B4A"},
                    {d:"Tesco Express Ranelagh",    c:"groceries",     a:"-€87.45",  col:"#EF9F27"},
                    {d:"Vanguard ETF Distribution", c:"investments",   a:"+€125.00", col:"#378ADD"},
                    {d:"Spotify Ireland Ltd",       c:"entertainment", a:"-€9.99",   col:"#1DB954"},
                  ].map((r,i)=>(
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0" style={{background:r.col+"22",color:r.col,border:`1px solid ${r.col}33`}}>{r.d[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{r.d}</p>
                        <p className="text-[9px] text-slate-400 capitalize">{r.c}</p>
                      </div>
                      <p className={`text-xs font-black shrink-0 ${r.a.startsWith("+")?"text-emerald-500":"text-slate-600 dark:text-slate-300"}`}>{r.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="py-14 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(s=>(
            <div key={s.v}>
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{s.v}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <LogoMark size={24}/>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">FinLytics features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
              Every tool a data analyst<br/>
              <span className="text-slate-400">builds first.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f=>(
              <div key={f.title} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{background:`${f.color}18`}}>
                  <f.icon className="h-5 w-5" style={{color:f.color}}/>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CHATBOT SECTION ─────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-1.5 text-sm text-blue-600 dark:text-blue-300 font-medium mb-6">
                <Brain className="h-4 w-4"/>
                FinLytics AI · Powered by Groq
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-5">
                Ask your data<br/>
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">anything.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-6">
                FinLytics AI reads your real transaction history and answers natural language questions about your finances — instantly.
              </p>
              <div className="space-y-3">
                {[
                  {q:"Where am I overspending the most?",     a:"Your top category is Food & Dining at €342/mo — 28% of expenses."},
                  {q:"What is my savings rate this month?",   a:"You saved 18.4% this month. That is up from 14% last month — great progress."},
                  {q:"Am I on track for my holiday goal?",    a:"You need €180/mo more to hit your target by July. Currently contributing €220 — you are on track!"},
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 text-xs flex items-center justify-center font-bold shrink-0">?</span>
                      {item.q}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/8 dark:shadow-black/40 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3 px-4 py-3.5 text-white" style={{background:"linear-gradient(135deg, #1851a3 0%, #0f6e56 100%)"}}>
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">FinLytics AI</p>
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                      Online · Groq · Llama 3.3
                    </p>
                  </div>
                  <div className="flex gap-1.5">{["#ef4444","#f59e0b","#22c55e"].map(col=><div key={col} className="w-3 h-3 rounded-full opacity-60" style={{background:col}}/>)}</div>
                </div>
                <div className="p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, #1851a3, #0f6e56)"}}>
                      <Brain className="h-3.5 w-3.5 text-white"/>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 max-w-[85%]">
                      Hi! I&apos;m FinLytics AI. I have access to your real transaction data. Ask me anything about your finances.
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white max-w-[80%]">
                      Where am I overspending?
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, #1851a3, #0f6e56)"}}>
                      <Brain className="h-3.5 w-3.5 text-white"/>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 max-w-[85%]">
                      <p className="mb-2">Based on your last 3 months:</p>
                      <div className="space-y-1.5">
                        {[["Food & Dining","€342/mo","28%","🍽️"],["Shopping","€198/mo","16%","🛍️"],["Entertainment","€89/mo","7%","🎬"]].map(([cat,amt,pct,em])=>(
                          <div key={cat} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-700 rounded-lg px-2.5 py-1.5">
                            <span>{em} {cat}</span>
                            <span className="font-bold text-red-500">{amt} <span className="text-slate-400">({pct})</span></span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Reducing Food by 20% saves €68/mo 💡</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5 text-sm text-slate-400">
                    Ask about your finances...
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" style={{background:"linear-gradient(135deg, #1851a3, #0f6e56)"}}>
                    <ArrowRight className="h-4 w-4"/>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Available on every page</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-500 mb-3">Three steps</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
              Analytics-ready<br/>
              <span className="text-slate-400">in under 5 minutes.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {HOW.map(h=>(
              <div key={h.n} className="relative">
                <p className="text-8xl font-black leading-none mb-4 select-none" style={{WebkitTextStroke:"1px #e2e8f0",color:"transparent"}}>{h.n}</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{h.t}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{h.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <section className="py-14 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">Powered by</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRUST.map(t=>(
              <div key={t.t} className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                  <t.icon className="h-5 w-5 text-blue-500"/>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.t}</p>
                <p className="text-[11px] text-slate-400">{t.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI CHATBOT TEASER ──────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-full px-4 py-1.5 text-sm text-teal-700 dark:text-teal-300 font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"/>
                AI Finance Advisor · Powered by Groq
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                Ask anything about<br/>
                <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">your finances.</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                The FinLytics AI advisor has full access to your real transaction data. Ask it to summarise your spending, identify where you can save, forecast next month or explain any anomalies — in plain English.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Where am I overspending the most?",
                  "What is my current savings rate?",
                  "How does my spending compare month to month?",
                  "Give me a full summary of my finances",
                ].map(q => (
                  <li key={q} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"/>
                    {q}
                  </li>
                ))}
              </ul>
              {!isSignedIn && (
                <Link href="/sign-up" className="inline-block mt-6">
                  <button className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20">
                    <BarChart2 className="h-4 w-4"/>
                    Try the AI advisor
                  </button>
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-teal-600 text-white">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-white"/>
                  </div>
                  <div>
                    <p className="font-bold text-sm"><span className="text-white/75">Fin</span>Lytics AI</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse"/>
                      <span className="text-[11px] text-white/65">Online · Groq · Llama 3.3</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0">
                      <BarChart2 className="h-3.5 w-3.5 text-white"/>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 max-w-[85%]">
                      Hi! I&apos;m your FinLytics AI advisor. I have full access to your transaction data. What would you like to know?
                    </div>
                  </div>
                  <div className="flex gap-2.5 justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs max-w-[85%]">
                      Where am I overspending the most?
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">You</span>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0">
                      <BarChart2 className="h-3.5 w-3.5 text-white"/>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 max-w-[85%] space-y-1">
                      <p>Your top 3 overspend areas this month:</p>
                      <p>• <strong>Food &amp; dining</strong> — €312 (32% of expenses)</p>
                      <p>• <strong>Shopping</strong> — €189 (19%)</p>
                      <p>• <strong>Entertainment</strong> — €97 (10%)</p>
                      <p className="text-teal-600 dark:text-teal-400 font-medium">Cutting dining by 20% saves ~€62/month.</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 pb-3 flex gap-2">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400">Ask about your finances...</div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0">
                    <Send className="h-3.5 w-3.5 text-white"/>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 flex items-center gap-2.5 h-12 px-4 rounded-2xl bg-gradient-to-r from-blue-700 to-teal-600 text-white shadow-xl text-sm font-bold">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <BarChart2 className="h-3.5 w-3.5"/>
                </div>
                Ask FinLytics AI
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8"><LogoMark size={56}/></div>
          <h2 className="text-4xl sm:text-6xl font-black leading-tight mb-6">
            <span className="text-slate-900 dark:text-white">Stop guessing</span><br/>
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">start analysing.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Import your first statement and get a complete analytics dashboard — health score, AI insights, forecasts and anomaly alerts — in under 60 seconds.
          </p>
          {isSignedIn ? (
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/dashboard">
                <button className="flex items-center gap-2.5 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white font-black px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-blue-500/25 hover:scale-[1.02] transition-all">
                  <BarChart2 className="h-5 w-5"/>Open my dashboard<ArrowRight className="h-5 w-5"/>
                </button>
              </Link>
              <Link href="/statement-import">
                <button className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-7 py-4 rounded-2xl text-lg border border-slate-200 dark:border-slate-700 transition-all">
                  Import statement
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/sign-up">
                <button className="group flex items-center gap-2.5 bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white font-black px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-blue-500/25 hover:scale-[1.02] transition-all">
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform"/>
                  Analyse my finances
                  <ArrowRight className="h-5 w-5"/>
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-7 py-4 rounded-2xl text-lg border border-slate-200 dark:border-slate-700 transition-all">
                  Sign in
                </button>
              </Link>
            </div>
          )}
          <p className="text-slate-400 text-sm mt-5">No credit card required · Works with any bank · Free forever</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-10 px-4 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={28}/>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                <span className="text-blue-600 dark:text-blue-400">Fin</span>Lytics
              </span>
              <p className="text-xs text-slate-400">Finance · Data · Analytics</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Built with Next.js 15 · Groq AI · Prisma · Clerk · &copy; 2026</p>
        </div>
      </footer>

    </div>
  );
}