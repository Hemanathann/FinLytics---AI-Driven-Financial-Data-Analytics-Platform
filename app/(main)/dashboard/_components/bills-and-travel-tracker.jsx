"use client";

import { useState } from "react";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import {
  Wifi, Zap, Smartphone, Droplets, Flame, Tv,
  Plus, Trash2, Edit2, CheckCircle2, AlertCircle,
  Check, X, Bus, Train, MapPin, TrendingUp,
  CreditCard, ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

// ── Bill type config ───────────────────────────────────────────
const BILL_TYPES = [
  { id:"wifi",       label:"WiFi / Broadband", icon:Wifi,       color:"#378ADD", bg:"bg-blue-50 dark:bg-blue-950/50",    keywords:["broadband","wifi","fiber","eir","virgin media","vodafone home","pure telecom","siro","sky broadband","three home","act fibernet","jio fiber","airtel fiber"] },
  { id:"electricity",label:"Electricity",      icon:Zap,        color:"#EF9F27", bg:"bg-amber-50 dark:bg-amber-950/50",  keywords:["electric ireland","airtricity","energia","prepay power","bord gais energy","tata power","bescom","msedcl","adani electricity","electricity"] },
  { id:"mobile",     label:"Mobile / Phone",   icon:Smartphone, color:"#1D9E75", bg:"bg-emerald-50 dark:bg-emerald-950/50", keywords:["vodafone","three ireland","eir mobile","tesco mobile","48 mobile","jio","airtel","vi recharge","bsnl","t-mobile","at&t"] },
  { id:"water",      label:"Water",            icon:Droplets,   color:"#06b6d4", bg:"bg-cyan-50 dark:bg-cyan-950/50",    keywords:["irish water","water bill","uisce eireann","bwssb","mcgm water","water rates"] },
  { id:"gas",        label:"Gas",              icon:Flame,      color:"#f97316", bg:"bg-orange-50 dark:bg-orange-950/50",keywords:["bord gais","gas networks","flogas","british gas","mahanagar gas","indraprastha gas"] },
  { id:"tv",         label:"TV / Cable",       icon:Tv,         color:"#7F77DD", bg:"bg-violet-50 dark:bg-violet-950/50",keywords:["sky tv","virgin media tv","tv licence","dish tv","tata sky","d2h","dstv"] },
];

// ── Ireland Leap Card / transport keywords ─────────────────────
const LEAP_KEYWORDS = ["leap card","leap top","leap topup","luas","dart","dublin bus","bus eireann","irish rail","iarnrod","tfi","translink","ulsterbus","metro bus"];
const TRAVEL_KEYWORDS = ["uber","bolt","taxi","free now","ryanair","aer lingus","train","bus","ferry","petrol","fuel","shell","bp ","applegreen","topaz","circle k fuel","parking","car park","ncp","toll"];

export function MonthlyBillsTracker({ transactions }) {
  const [manualBills, setManualBills] = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [form, setForm] = useState({ type:"wifi", name:"", amount:"", dueDay:"1", notes:"" });

  // Auto-detect bills from transactions (last 60 days)
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const recent = (transactions||[]).filter(t => new Date(t.date) >= cutoff && t.type === "EXPENSE");

  const detectedBills = BILL_TYPES.map(bt => {
    const matches = recent.filter(t =>
      bt.keywords.some(k => (t.description||"").toLowerCase().includes(k))
    );
    if (!matches.length) return null;
    const latest = matches.sort((a,b) => new Date(b.date)-new Date(a.date))[0];
    const avg = matches.reduce((s,t)=>s+Number(t.amount),0) / matches.length;
    return { ...bt, amount: avg, lastDate: latest.date, count: matches.length };
  }).filter(Boolean);

  const allBills = [
    ...detectedBills.map(b => ({ ...b, source:"auto" })),
    ...manualBills.map(b => ({ ...b, source:"manual" })),
  ];
  const totalMonthly = allBills.reduce((s,b) => s + (Number(b.amount)||0), 0);
  const totalAnnual  = totalMonthly * 12;

  const saveForm = () => {
    if (!form.name || !form.amount) return;
    const bt = BILL_TYPES.find(b => b.id === form.type) || BILL_TYPES[0];
    if (editId) {
      setManualBills(p => p.map(b => b.id===editId ? { ...bt, ...form, id:editId, source:"manual" } : b));
      setEditId(null);
    } else {
      setManualBills(p => [...p, { ...bt, ...form, id:Date.now(), source:"manual" }]);
    }
    setForm({ type:"wifi", name:"", amount:"", dueDay:"1", notes:"" });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l:"Monthly bills", v:`${fmt(totalMonthly)}`, c:"text-red-500" },
          { l:"Annual total",  v:`${fmt(totalAnnual)}`,  c:"text-orange-500" },
          { l:"Bills tracked", v:`${allBills.length}`,           c:"text-foreground" },
        ].map(s => (
          <div key={s.l} className="p-3 rounded-2xl border bg-card text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.l}</p>
            <p className={cn("text-lg font-black", s.c)}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Auto-detected */}
      {detectedBills.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5"/>
            Auto-detected from your transactions
          </p>
          <div className="space-y-2">
            {detectedBills.map(b => (
              <div key={b.id} className={cn("flex items-center gap-3 p-3.5 rounded-2xl border", b.bg)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${b.color}20`}}>
                  <b.icon className="h-5 w-5" style={{color:b.color}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{b.label}</p>
                  <p className="text-[11px] text-muted-foreground">{b.count}× detected · Last: {format(new Date(b.lastDate),"dd MMM")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black">{fmt(Number(b.amount))}/mo</p>
                  <p className="text-[10px] text-muted-foreground">{fmt(Number(b.amount)*12)}/yr</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual add form */}
      {showForm && (
        <div className="p-4 rounded-2xl border bg-muted/30 space-y-3">
          <p className="text-xs font-bold">Add bill manually</p>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              className="col-span-2 bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20">
              {BILL_TYPES.map(bt=><option key={bt.id} value={bt.id}>{bt.label}</option>)}
            </select>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="e.g. Eir Broadband" className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
            <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
              type="number" placeholder="Amount/month ($)" className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
            <select value={form.dueDay} onChange={e=>setForm(f=>({...f,dueDay:e.target.value}))}
              className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20">
              {Array.from({length:28},(_,i)=><option key={i+1} value={i+1}>Due: {i+1}{["st","nd","rd"][i]||"th"} of month</option>)}
            </select>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              placeholder="Notes (optional)" className="bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
          </div>
          <div className="flex gap-2">
            <button onClick={saveForm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl py-2.5 transition-colors">
              Save Bill
            </button>
            <button onClick={()=>{setShowForm(false);setEditId(null);}} className="px-4 border rounded-xl text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual bills */}
      {manualBills.length > 0 && (
        <div className="space-y-2">
          {manualBills.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-3.5 rounded-2xl border bg-card">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${b.color}20`}}>
                <b.icon className="h-5 w-5" style={{color:b.color}}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{b.name || b.label}</p>
                <p className="text-[11px] text-muted-foreground">Due {b.dueDay}{["st","nd","rd"][b.dueDay-1]||"th"} of month {b.notes && `· ${b.notes}`}</p>
              </div>
              <div className="text-right shrink-0 mr-1">
                <p className="text-sm font-black">{fmt(Number(b.amount))}/mo</p>
                <p className="text-[10px] text-muted-foreground">{fmt(Number(b.amount)*12)}/yr</p>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>{setEditId(b.id);setForm({type:b.id,name:b.name,amount:b.amount,dueDay:b.dueDay,notes:b.notes||""});setShowForm(true);}}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit2 className="h-3.5 w-3.5 text-muted-foreground"/></button>
                <button onClick={()=>setManualBills(p=>p.filter(x=>x.id!==b.id))}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500"/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {allBills.length === 0 && !showForm && (
        <div className="text-center py-8 rounded-2xl border border-dashed">
          <Wifi className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2"/>
          <p className="text-sm text-muted-foreground">No bills detected yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Import statements or add manually below</p>
        </div>
      )}

      {!showForm && (
        <button onClick={()=>setShowForm(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed hover:bg-muted/40 transition-colors text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4"/>Add bill manually
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TRAVEL / LEAP CARD TRACKER
// ════════════════════════════════════════════════════════════════
export function TravelTracker({ transactions }) {
  const [viewAll, setViewAll] = useState(false);

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const transportTxns = (transactions||[]).filter(t =>
    t.type === "EXPENSE" && t.category === "transportation" &&
    new Date(t.date) >= sixtyDaysAgo
  );

  // Separate Leap Card from general transport
  const leapTxns = transportTxns.filter(t =>
    LEAP_KEYWORDS.some(k => (t.description||"").toLowerCase().includes(k))
  );
  const otherTxns = transportTxns.filter(t =>
    !LEAP_KEYWORDS.some(k => (t.description||"").toLowerCase().includes(k))
  );

  const thisMonthTransport = transportTxns.filter(t => new Date(t.date) >= thisMonthStart);
  const thisMonthTotal = thisMonthTransport.reduce((s,t) => s+Number(t.amount), 0);
  const leapTotal = leapTxns.reduce((s,t) => s+Number(t.amount), 0);
  const otherTotal = otherTxns.reduce((s,t) => s+Number(t.amount), 0);
  const avgPerTrip = leapTxns.length > 0 ? leapTotal / leapTxns.length : 0;

  // Group by transport type for breakdown
  const breakdown = {};
  transportTxns.forEach(t => {
    const desc = (t.description||"other").toLowerCase();
    const type = LEAP_KEYWORDS.some(k=>desc.includes(k)) ? "Public Transport" :
                 desc.includes("uber")||desc.includes("bolt")||desc.includes("taxi")||desc.includes("free now") ? "Taxi / Rideshare" :
                 desc.includes("petrol")||desc.includes("fuel")||desc.includes("shell")||desc.includes("bp")||desc.includes("applegreen")||desc.includes("topaz")||desc.includes("circle k") ? "Fuel / Petrol" :
                 desc.includes("parking")||desc.includes("car park")||desc.includes("ncp") ? "Parking" :
                 desc.includes("ryanair")||desc.includes("aer lingus")||desc.includes("flight")||desc.includes("airlines") ? "Flights" :
                 "Other Transport";
    breakdown[type] = (breakdown[type]||0) + Number(t.amount);
  });

  const sortedBreakdown = Object.entries(breakdown).sort(([,a],[,b])=>b-a);
  const maxAmt = sortedBreakdown[0]?.[1] || 1;

  const displayTxns = viewAll ? leapTxns : leapTxns.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"This month",    v:`${fmt(thisMonthTotal)}`, c:"text-blue-600 dark:text-blue-400", bg:"bg-blue-50 dark:bg-blue-950/50" },
          { l:"Leap card (2mo)",v:`${fmt(leapTotal)}`,    c:"text-emerald-600",  bg:"bg-emerald-50 dark:bg-emerald-950/50" },
          { l:"Avg per trip",  v:leapTxns.length?`${fmt(avgPerTrip)}`:"—",c:"text-foreground",bg:"bg-muted/50" },
          { l:"Total trips",   v:`${leapTxns.length}`,           c:"text-violet-600",   bg:"bg-violet-50 dark:bg-violet-950/50" },
        ].map(s=>(
          <div key={s.l} className={cn("p-3 rounded-2xl border text-center",s.bg)}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.l}</p>
            <p className={cn("text-base font-black",s.c)}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Breakdown by type */}
      {sortedBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl border bg-card">
          <p className="text-xs font-bold mb-3">Transport breakdown — last 60 days</p>
          <div className="space-y-2.5">
            {sortedBreakdown.map(([type, amt]) => (
              <div key={type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{type}</span>
                  <span className="font-black">{fmt(amt)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all"
                    style={{width:`${(amt/maxAmt)*100}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leap card trips */}
      {leapTxns.length > 0 ? (
        <div>
          <p className="text-xs font-bold mb-2 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-blue-500"/>
            Leap Card / Public Transport trips
          </p>
          <div className="space-y-1.5">
            {displayTxns.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <Bus className="h-4 w-4 text-blue-600 dark:text-blue-300"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(t.date),"dd MMM yyyy")}</p>
                </div>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 shrink-0">{fmt(Number(t.amount))}</p>
              </div>
            ))}
          </div>
          {leapTxns.length > 5 && (
            <button onClick={()=>setViewAll(v=>!v)} className="w-full mt-2 text-xs text-blue-600 font-semibold flex items-center justify-center gap-1 py-2">
              {viewAll ? <><ChevronUp className="h-3.5 w-3.5"/>Show less</> : <><ChevronDown className="h-3.5 w-3.5"/>Show all {leapTxns.length} trips</>}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 rounded-2xl border border-dashed">
          <Bus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2"/>
          <p className="text-sm text-muted-foreground">No Leap card / transport transactions found</p>
          <p className="text-xs text-muted-foreground mt-0.5">Import a bank statement with transport payments to track them</p>
        </div>
      )}

      <Link href="/analytics?tab=spending" className="flex items-center justify-center gap-2 p-3 rounded-2xl border hover:bg-muted/40 transition-colors text-xs font-semibold text-blue-600 dark:text-blue-400">
        View full transport analytics<ArrowRight className="h-3.5 w-3.5"/>
      </Link>
    </div>
  );
}