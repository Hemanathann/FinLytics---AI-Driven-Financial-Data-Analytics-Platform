"use client";

import { useState, useEffect } from "react";
import { fmt, fmtCompact } from "@/lib/currency-utils";
import {
  Calendar, TrendingDown, AlertCircle, CheckCircle2,
  Plus, Trash2, CreditCard, PiggyBank, Edit2,
  ReceiptText, ChevronDown, ChevronUp, Wallet,
  TrendingUp, Clock, Users, Percent, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addMonths, setDate } from "date-fns";

// ── SSR-safe localStorage helpers ────────────────────────────
function lsGet(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key, val) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─────────────────────────────────────────────────────────────
// 1. PAYDAY TRACKER
// ─────────────────────────────────────────────────────────────
export function PaydayTracker({ transactions = [] }) {
  const [mounted, setMounted]   = useState(false);
  const [payday,  setPayday]    = useState(25);
  const [editing, setEditing]   = useState(false);
  const [tempDay, setTempDay]   = useState("25");

  // Load from localStorage only after mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    const saved = lsGet("finlytics_payday", 25);
    setPayday(saved);
    setTempDay(String(saved));
  }, []);

  const savePayday = () => {
    const d = parseInt(tempDay, 10);
    if (isNaN(d) || d < 1 || d > 28) return;
    setPayday(d);
    lsSet("finlytics_payday", d);
    setEditing(false);
  };

  const now = new Date();

  // Work out last and next payday
  let lastPayday = setDate(now, payday);
  if (lastPayday > now) lastPayday = setDate(addMonths(now, -1), payday);
  let nextPayday = setDate(now, payday);
  if (nextPayday <= now) nextPayday = setDate(addMonths(now, 1), payday);

  const daysLeft      = differenceInDays(nextPayday, now);
  const daysSince     = differenceInDays(now, lastPayday);
  const periodTotal   = differenceInDays(nextPayday, lastPayday);

  // Transactions since last payday
  const sincePay  = transactions.filter(
    t => t.type === "EXPENSE" && new Date(t.date) >= lastPayday
  );
  const spent     = sincePay.reduce((s, t) => s + Number(t.amount), 0);
  const dailyRate = daysSince > 0 ? spent / daysSince : 0;
  const forecast  = dailyRate * periodTotal;

  // Last detected salary amount
  const lastSalary = transactions
    .filter(t => t.type === "INCOME" && t.category === "salary" &&
      new Date(t.date) >= addMonths(now, -2))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const salary      = lastSalary ? Number(lastSalary.amount) : null;
  const remaining   = salary ? salary - spent : null;
  const dailyBudget = salary ? salary / periodTotal : null;
  const onTrack     = dailyBudget ? dailyRate <= dailyBudget * 1.1 : true;
  const timePct     = Math.min(100, (daysSince / periodTotal) * 100);
  const spendPct    = salary ? Math.min(100, (spent / salary) * 100) : null;

  if (!mounted) return (
    <div className="animate-pulse space-y-3">
      <div className="h-32 bg-muted rounded-2xl"/>
      <div className="h-20 bg-muted rounded-2xl"/>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Payday setting */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Pay period: {format(lastPayday, "dd MMM")} → {format(nextPayday, "dd MMM")}
        </p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Day</span>
            <input
              value={tempDay}
              onChange={e => setTempDay(e.target.value)}
              type="number" min="1" max="28"
              className="w-14 text-center text-sm bg-muted rounded-lg px-2 py-1.5 outline-none border focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-xs text-muted-foreground">of month</span>
            <button onClick={savePayday}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Save
            </button>
            <button onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline">
            <Edit2 className="h-3 w-3"/>Payday: {payday}th
          </button>
        )}
      </div>

      {/* Countdown hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-800 text-white text-center">
        <p className="text-blue-200 text-[11px] uppercase tracking-widest mb-1">Next salary in</p>
        <p className="text-6xl font-black leading-none mb-1">{daysLeft}</p>
        <p className="text-blue-200 text-sm">day{daysLeft !== 1 ? "s" : ""} · {format(nextPayday, "dd MMM yyyy")}</p>
      </div>

      {/* Dual progress */}
      <div className="p-4 rounded-2xl border bg-card space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Time through pay period</span>
            <span className="font-semibold">Day {daysSince} of {periodTotal}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
              style={{ width: `${timePct}%` }}/>
          </div>
        </div>
        {spendPct !== null && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Budget used</span>
              <span className={cn("font-semibold",
                spendPct > timePct + 15 ? "text-red-500" : "text-emerald-500")}>
                {Math.round(spendPct)}%
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${spendPct}%`,
                  background: spendPct > timePct + 15 ? "#E24B4A" : "#1D9E75"
                }}/>
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:"Spent this period", value:`${fmt(spent)}`,
            color:"text-red-500 dark:text-red-400",    bg:"bg-red-50 dark:bg-red-950/40" },
          { label:"Daily spend rate",  value:`${fmt(dailyRate)}/day`,
            color:"text-amber-600 dark:text-amber-400",bg:"bg-amber-50 dark:bg-amber-950/40" },
          { label:"Budget remaining",
            value: remaining !== null ? `${fmt(remaining)}` : "Set salary category",
            color: remaining !== null ? (remaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500") : "text-muted-foreground",
            bg:"bg-emerald-50 dark:bg-emerald-950/40" },
          { label:"Spend forecast",    value:`${fmt(forecast)}`,
            color:"text-foreground",                   bg:"bg-muted/50" },
        ].map(s => (
          <div key={s.label} className={cn("p-3.5 rounded-2xl border", s.bg)}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
            <p className={cn("text-sm font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* On-track status */}
      <div className={cn("flex items-start gap-3 p-4 rounded-2xl border",
        onTrack
          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"
          : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
      )}>
        {onTrack
          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
          : <AlertCircle  className="h-4 w-4 text-red-500 shrink-0 mt-0.5"/>
        }
        <p className={cn("text-xs font-medium leading-relaxed",
          onTrack ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"
        )}>
          {onTrack
            ? `On track — spending ${fmt(dailyRate)}/day, within your daily budget.`
            : `Overspending — at ${fmt(dailyRate)}/day, forecast total of ${fmt(forecast)}${salary ? ` is ${fmt((forecast - salary))} over your salary` : ""}.`
          }
        </p>
      </div>

      {!lastSalary && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Import a bank statement with salary transactions to enable budget tracking
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. BILL SPLIT CALCULATOR
// ─────────────────────────────────────────────────────────────
const TIP_PRESETS = [0, 10, 12.5, 15, 20];

export function BillSplitCalculator({ transactions = [] }) {
  const [total,   setTotal]   = useState("");
  const [people,  setPeople]  = useState(2);
  const [tip,     setTip]     = useState(0);
  const [names,   setNames]   = useState(["You", "Friend"]);
  const [customTip, setCustomTip] = useState("");

  // Quick-fill: recent food/restaurant/entertainment transactions
  const recent = transactions
    .filter(t => t.type === "EXPENSE" &&
      ["food", "groceries", "entertainment"].includes(t.category))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const billAmt    = parseFloat(total) || 0;
  const tipPct     = parseFloat(customTip || tip) || 0;
  const tipAmt     = billAmt * (tipPct / 100);
  const grand      = billAmt + tipAmt;
  const numPeople  = Math.max(1, people);
  const perPerson  = numPeople > 0 ? grand / numPeople : 0;

  const syncPeople = (n) => {
    const num = Math.max(1, Math.min(20, n));
    setPeople(num);
    setNames(prev => {
      const arr = [...prev];
      while (arr.length < num) arr.push(`Person ${arr.length + 1}`);
      return arr.slice(0, num);
    });
  };

  const setTipPreset = (t) => {
    setTip(t);
    setCustomTip("");
  };

  return (
    <div className="space-y-4">

      {/* Quick-fill from transactions */}
      {recent.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Quick-fill from recent transactions
          </p>
          <div className="flex gap-2 flex-wrap">
            {recent.map((t, i) => (
              <button key={i}
                onClick={() => setTotal(Number(t.amount).toFixed(2))}
                className="flex items-center gap-2 text-xs bg-muted hover:bg-muted/70 border rounded-xl px-3 py-2 transition-colors group">
                <ReceiptText className="h-3.5 w-3.5 text-muted-foreground"/>
                <span className="truncate max-w-[90px]">{t.cleanName || t.description}</span>
                <span className="font-black text-foreground">{fmt(Number(t.amount))}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bill amount input */}
      <div className="p-5 rounded-2xl border bg-card">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bill total</p>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
          <input
            value={total}
            onChange={e => setTotal(e.target.value)}
            type="number" step="0.01" placeholder="0.00"
            className="w-full pl-10 text-3xl font-black bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* People selector */}
      <div className="p-4 rounded-2xl border bg-card">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Split between</p>
        <div className="flex items-center gap-4">
          <button onClick={() => syncPeople(numPeople - 1)} disabled={numPeople <= 1}
            className="w-10 h-10 rounded-xl border bg-muted hover:bg-muted/70 flex items-center justify-center text-xl font-bold disabled:opacity-30 transition-colors">
            −
          </button>
          <div className="flex-1 text-center">
            <p className="text-4xl font-black">{numPeople}</p>
            <p className="text-xs text-muted-foreground">people</p>
          </div>
          <button onClick={() => syncPeople(numPeople + 1)} disabled={numPeople >= 20}
            className="w-10 h-10 rounded-xl border bg-muted hover:bg-muted/70 flex items-center justify-center text-xl font-bold disabled:opacity-30 transition-colors">
            +
          </button>
        </div>
      </div>

      {/* Tip selector */}
      <div className="p-4 rounded-2xl border bg-card">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tip</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {TIP_PRESETS.map(t => (
            <button key={t}
              onClick={() => setTipPreset(t)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                (!customTip && tip === t)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-muted border-transparent hover:bg-muted/70"
              )}>
              {t === 0 ? "No tip" : `${t}%`}
            </button>
          ))}
          <div className="relative">
            <input
              value={customTip}
              onChange={e => { setCustomTip(e.target.value); setTip(0); }}
              type="number" min="0" max="100" step="0.5" placeholder="Custom"
              className={cn(
                "w-24 text-sm rounded-xl px-3 py-2 outline-none border transition-all",
                customTip
                  ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400 text-blue-700 dark:text-blue-300"
                  : "bg-muted border-transparent"
              )}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
          </div>
        </div>
        {tipAmt > 0 && (
          <p className="text-xs text-muted-foreground">
          Tip: {fmt(tipAmt)} · Total with tip: {fmt(grand)}
          </p>
        )}
      </div>

      {/* Result */}
      {billAmt > 0 && (
        <>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 text-white text-center">
            <p className="text-blue-100 text-[11px] uppercase tracking-widest mb-1">Each person pays</p>
            <p className="text-5xl font-black">{fmt(perPerson)}</p>
            <p className="text-blue-100 text-sm mt-1">
              {fmt(billAmt)} ÷ {numPeople} people{tipAmt > 0 ? ` + ${fmt(tipAmt)} tip` : ""}
            </p>
          </div>

          {/* Per-person breakdown */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Breakdown</p>
            {names.slice(0, numPeople).map((name, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border bg-card">
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-sm font-black text-blue-700 dark:text-blue-300 shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <input
                  value={name}
                  onChange={e => setNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                  className="flex-1 text-sm font-semibold bg-transparent outline-none text-foreground"
                  placeholder={`Person ${i + 1}`}
                />
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 shrink-0">
                  {fmt(perPerson)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {billAmt === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Enter a bill amount above to calculate the split
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. LOAN / EMI TRACKER
// Supports two modes:
//   A) Standard reducing-balance (home/car/personal loans)
//   B) Compound Interest / Education (Credila PG2, HDFC Credila, etc.)
// ─────────────────────────────────────────────────────────────

// ── Standard reducing-balance EMI ────────────────────────────
function calcEMI(principal, annualRate, months) {
  if (!principal || !months || principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function buildReducingSchedule(principal, annualRate, months) {
  const emi = calcEMI(principal, annualRate, months);
  const r   = annualRate / 12 / 100;
  let balance = principal;
  const rows = [];
  for (let i = 1; i <= months; i++) {
    const interest  = annualRate > 0 ? balance * r : 0;
    const prinPart  = Math.min(balance, emi - interest);
    balance         = Math.max(0, balance - prinPart);
    rows.push({ month:i, emi, principal:prinPart, interest, balance });
  }
  return rows;
}

// ── Compound Interest (CI) — Credila PG2 style ───────────────
// Formula: balance_new = balance_old × (1 + r) - payment
// Works for tranche education loans with moratorium + part payment phases
function buildCISchedule(currentOutstanding, annualRate, phases) {
  // phases: [{months, payment}, ...] — from current date forward
  const r = annualRate / 12 / 100;
  let balance = currentOutstanding;
  const rows = [];
  let month = 0;
  for (const phase of phases) {
    for (let i = 0; i < phase.months; i++) {
      month++;
      const interest = balance * r;
      const payment  = phase.payment;
      const net      = balance + interest - payment;
      balance        = Math.max(0, net);
      rows.push({ month, interest, payment, balance, increasing: net > balance + 1 });
      if (balance === 0) break;
    }
    if (balance === 0) break;
  }
  return rows;
}

function getCIStats(loan) {
  const now = new Date();
  const nextDue = new Date(loan.nextDueDate);
  const daysToNext = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));

  const phases = [];
  // Phase 1: current partial payment until full EMI date
  if (loan.fullEmiStartDate) {
    const fullStart = new Date(loan.fullEmiStartDate);
    const partMonths = Math.max(0, Math.round((fullStart - now) / (1000 * 60 * 60 * 24 * 30.44)));
    if (partMonths > 0) phases.push({ months: partMonths, payment: parseFloat(loan.currentPayment) || 0 });
    phases.push({ months: 300, payment: parseFloat(loan.fullEmi) });
  } else {
    phases.push({ months: 300, payment: parseFloat(loan.fullEmi || loan.currentPayment) });
  }

  const schedule = buildCISchedule(loan.outstanding, loan.rate, phases);
  const totalMonths = schedule.length;

  // Monthly interest on current outstanding
  const r = loan.rate / 12 / 100;
  const thisMonthInterest = loan.outstanding * r;
  const thisMonthPayment  = phases[0].payment;
  const thisMonthNet      = thisMonthInterest - thisMonthPayment;

  const payoffDate = new Date(now);
  payoffDate.setMonth(payoffDate.getMonth() + totalMonths);

  const totalPayable = schedule.reduce((s, r) => s + r.payment, 0);
  const totalInterest = totalPayable - loan.outstanding;

  return {
    schedule, totalMonths, daysToNext, nextDue,
    thisMonthInterest, thisMonthPayment, thisMonthNet,
    payoffDate, totalPayable, totalInterest,
    isAccruing: thisMonthNet > 0,
    nextPaymentBreakdown: {
      interest: Math.round(thisMonthInterest),
      principal: Math.max(0, Math.round(thisMonthPayment - thisMonthInterest)),
    }
  };
}

// ── Reducing-balance stats (used for standard loans) ─────────
function getReducingStats(loan) {
  const start = new Date(loan.startDate);
  const now   = new Date();
  const emi   = loan.emi;
  let monthsPaid = 0;
  let cursor = new Date(start);
  while (true) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + 1);
    if (next > now) break;
    cursor = next;
    monthsPaid++;
    if (monthsPaid >= loan.months) break;
  }
  monthsPaid = Math.min(monthsPaid, loan.months);
  const schedule      = buildReducingSchedule(loan.principal, loan.rate, loan.months);
  const paidRows      = schedule.slice(0, monthsPaid);
  const remainRows    = schedule.slice(monthsPaid);
  const totalPaid     = paidRows.reduce((s,r)=>s+r.emi,0);
  const prinPaid      = paidRows.reduce((s,r)=>s+r.principal,0);
  const intPaid       = paidRows.reduce((s,r)=>s+r.interest,0);
  const outstanding   = loan.principal - prinPaid;
  const futureInt     = remainRows.reduce((s,r)=>s+r.interest,0);
  const totalRemain   = outstanding + futureInt;
  const monthsLeft    = loan.months - monthsPaid;
  const totalInterest = schedule.reduce((s,r)=>s+r.interest,0);
  const totalPayable  = loan.principal + totalInterest;
  const pct           = Math.min(100,(monthsPaid/loan.months)*100);
  const nextEmiDate   = new Date(start);
  nextEmiDate.setMonth(nextEmiDate.getMonth() + monthsPaid + 1);
  const daysToNext    = Math.ceil((nextEmiDate - now)/(1000*60*60*24));
  const payoffDate    = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + loan.months);
  return {
    monthsPaid, monthsLeft, pct, totalPaid, prinPaid, intPaid,
    outstanding, futureInt, totalRemain, totalInterest, totalPayable,
    nextEmiDate, daysToNext, payoffDate, schedule,
    nextEmiRow: remainRows[0] || null,
  };
}

const LOAN_TYPES = [
  { label:"Home Loan",      icon:"🏠", ci:false },
  { label:"Car Finance",    icon:"🚗", ci:false },
  { label:"Personal Loan",  icon:"💳", ci:false },
  { label:"Credit Union",   icon:"🏦", ci:false },
  { label:"Education Loan", icon:"🎓", ci:true  },  // CI type
  { label:"Business Loan",  icon:"💼", ci:false },
  { label:"Home Improve.",  icon:"🔨", ci:false },
  { label:"Other CI Loan",  icon:"📋", ci:true  },
];

const EMPTY_FORM = {
  name:"", type:"Home Loan", icon:"🏠", loanMode:"standard",
  // Standard fields
  principal:"", rate:"", months:"", startDate:"",
  // CI fields
  outstanding:"", currentPayment:"", fullEmi:"",
  fullEmiStartDate:"", nextDueDate:"",
};

export function LoanTracker() {
  const [mounted,  setMounted]  = useState(false);
  const [loans,    setLoans]    = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [form,     setForm]     = useState(EMPTY_FORM);

  useEffect(() => { setMounted(true); setLoans(lsGet("finlytics_loans",[])); }, []);
  const saveLoans = u => { setLoans(u); lsSet("finlytics_loans", u); };
  const deleteLoan = id => saveLoans(loans.filter(l=>l.id!==id));
  const toggleExp  = id => setExpanded(p=>({...p,[id]:!p[id]}));

  const selectType = (lt) => setForm(f=>({
    ...f, type:lt.label, icon:lt.icon,
    name:lt.label, loanMode:lt.ci?"ci":"standard"
  }));

  const addLoan = () => {
    if (form.loanMode === "ci") {
      if (!form.outstanding||!form.rate||!form.nextDueDate) return;
      const fullEmi = parseFloat(form.fullEmi)||parseFloat(form.currentPayment)||0;
      saveLoans([...loans,{
        ...form, id:Date.now(), mode:"ci",
        outstanding: parseFloat(form.outstanding),
        rate:        parseFloat(form.rate),
        currentPayment: parseFloat(form.currentPayment)||0,
        fullEmi,
      }]);
    } else {
      const p=parseFloat(form.principal),r=parseFloat(form.rate),m=parseInt(form.months,10);
      if (!p||!m||!form.startDate) return;
      saveLoans([...loans,{...form,id:Date.now(),mode:"standard",principal:p,rate:r||0,months:m,emi:calcEMI(p,r||0,m)}]);
    }
    setForm(EMPTY_FORM); setShowForm(false);
  };

  // Live preview (standard mode)
  const pp=parseFloat(form.principal)||0, pr=parseFloat(form.rate)||0, pm=parseInt(form.months)||0;
  const pEMI=calcEMI(pp,pr,pm), pTotal=pEMI*pm, pInt=pTotal-pp;

  if (!mounted) return <div className="animate-pulse space-y-3"><div className="h-24 bg-muted rounded-2xl"/><div className="h-24 bg-muted rounded-2xl"/></div>;

  return (
    <div className="space-y-4">

      {/* ── ADD FORM ─────────────────────────────────────────── */}
      {showForm && (
        <div className="p-5 rounded-2xl border bg-muted/20 space-y-4">
          <p className="text-sm font-bold">Add a loan</p>

          {/* Type picker */}
          <div className="grid grid-cols-4 gap-2">
            {LOAN_TYPES.map(lt=>(
              <button key={lt.label} onClick={()=>selectType(lt)}
                className={cn("p-2.5 rounded-xl border text-center text-[11px] font-medium transition-all",
                  form.type===lt.label
                    ?"border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                    :"border-transparent bg-muted/50 hover:bg-muted")}>
                <div className="text-xl mb-1">{lt.icon}</div>
                <div className="leading-tight">{lt.label}</div>
                {lt.ci && <div className="text-[9px] text-blue-500 font-bold mt-0.5">CI LOAN</div>}
              </button>
            ))}
          </div>

          {/* Mode indicator */}
          {form.loanMode==="ci" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5"/>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Compound Interest (CI) mode</strong> — for Credila, HDFC Credila, Avanse and similar education loans.
                Uses your current outstanding balance from the latest bank statement. More accurate than using original principal.
              </p>
            </div>
          )}

          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            placeholder="Loan name (e.g. Credila Education Loan)"
            className="w-full bg-background rounded-xl px-3.5 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>

          {/* ── STANDARD fields ── */}
          {form.loanMode==="standard" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {key:"principal",label:"Loan amount",      ph:"e.g. 50000",  type:"number"},
                  {key:"rate",     label:"Annual rate (%)",   ph:"e.g. 8.5",    type:"number"},
                  {key:"months",   label:"Term (months)",     ph:"e.g. 240",    type:"number"},
                  {key:"startDate",label:"First payment date",ph:"",            type:"date"},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{f.label}</label>
                    <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                      type={f.type} placeholder={f.ph}
                      className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                  </div>
                ))}
              </div>
              {pp>0&&pm>0&&(
                <div className="grid grid-cols-3 gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-center">
                  {[
                    {l:"Monthly EMI",   v:`${fmt(pEMI)}`,  c:"text-blue-700 dark:text-blue-300"},
                    {l:"Total interest",v:`${fmt(pInt)}`,   c:"text-red-600 dark:text-red-400"},
                    {l:"Total payable", v:`${fmt(pTotal)}`, c:"text-foreground"},
                  ].map(s=>(
                    <div key={s.l} className="bg-white/60 dark:bg-white/5 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{s.l}</p>
                      <p className={cn("text-sm font-black",s.c)}>{s.v}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CI fields ── */}
          {form.loanMode==="ci" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                    Current outstanding balance (from latest statement)
                  </label>
                  <input value={form.outstanding} onChange={e=>setForm(f=>({...f,outstanding:e.target.value}))}
                    type="number" placeholder="e.g. 1050000"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Annual interest rate (%)</label>
                  <input value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))}
                    type="number" placeholder="e.g. 11.67"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Current monthly payment</label>
                  <input value={form.currentPayment} onChange={e=>setForm(f=>({...f,currentPayment:e.target.value}))}
                    type="number" placeholder="e.g. 5000"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Full EMI (once moratorium ends)</label>
                  <input value={form.fullEmi} onChange={e=>setForm(f=>({...f,fullEmi:e.target.value}))}
                    type="number" placeholder="e.g. 14774"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Full EMI start date</label>
                  <input value={form.fullEmiStartDate} onChange={e=>setForm(f=>({...f,fullEmiStartDate:e.target.value}))}
                    type="date"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Next payment due date</label>
                  <input value={form.nextDueDate} onChange={e=>setForm(f=>({...f,nextDueDate:e.target.value}))}
                    type="date"
                    className="w-full bg-background rounded-xl px-3 py-2.5 text-sm outline-none border focus:ring-2 focus:ring-blue-500/20"/>
                </div>
              </div>

              {/* Live CI preview */}
              {form.outstanding && form.rate && form.fullEmi && (
                (()=>{
                  const bal = parseFloat(form.outstanding)||0;
                  const r   = (parseFloat(form.rate)||0)/12/100;
                  const emi = parseFloat(form.fullEmi)||0;
                  const cp  = parseFloat(form.currentPayment)||0;
                  const thisInt = bal * r;
                  const isAccruing = thisInt > cp;
                  const phases = form.fullEmiStartDate
                    ? [
                        {months: Math.max(0,Math.round((new Date(form.fullEmiStartDate)-new Date())/(1000*60*60*24*30.44))), payment:cp},
                        {months:300, payment:emi}
                      ]
                    : [{months:300, payment:emi}];
                  const sched = buildCISchedule(bal, parseFloat(form.rate)||0, phases);
                  const payoffDate = new Date();
                  payoffDate.setMonth(payoffDate.getMonth() + sched.length);
                  const totalPay = sched.reduce((s,r)=>s+r.payment,0);
                  return (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3">
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Live CI projection</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {[
                          {l:"Monthly interest", v:`₹${thisInt.toFixed(0)}`, c:isAccruing?"text-red-600":"text-emerald-600"},
                          {l:"Payoff in",  v:`${sched.length} months`, c:"text-foreground"},
                          {l:"Payoff date",v:format(payoffDate,"MMM yyyy"), c:"text-blue-600 dark:text-blue-400"},
                          {l:"Total payable",v:`₹${totalPay.toFixed(0)}`, c:"text-foreground"},
                        ].map(s=>(
                          <div key={s.l} className="bg-white/60 dark:bg-white/5 rounded-lg p-2">
                            <p className="text-[10px] text-muted-foreground mb-0.5">{s.l}</p>
                            <p className={cn("text-sm font-black",s.c)}>{s.v}</p>
                          </div>
                        ))}
                      </div>
                      {isAccruing && (
                        <p className="text-[11px] text-red-600 dark:text-red-400">
                          ⚠ Current payment (₹{cp.toFixed(0)}) is less than monthly interest (₹{thisInt.toFixed(0)}) — balance is growing by ₹{(thisInt-cp).toFixed(0)}/month
                        </p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={addLoan}
              disabled={form.loanMode==="ci" ? (!form.outstanding||!form.rate||!form.nextDueDate) : (!form.principal||!form.months||!form.startDate)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
              Add Loan
            </button>
            <button onClick={()=>{setShowForm(false);setForm(EMPTY_FORM);}}
              className="px-5 border rounded-xl text-sm hover:bg-muted transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* ── LOAN CARDS ───────────────────────────────────────── */}
      {loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map(loan => {
            const isCi      = loan.mode === "ci";
            const isExp     = expanded[loan.id];

            if (isCi) {
              // ── CI LOAN CARD ──────────────────────────────
              const s = getCIStats(loan);
              const overdueOrSoon = s.daysToNext <= 5;

              return (
                <div key={loan.id} className="rounded-2xl border bg-card overflow-hidden">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{loan.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{loan.name}</p>
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">CI</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{loan.type} · {loan.rate}% p.a. compound interest</p>
                        </div>
                      </div>
                      <button onClick={()=>deleteLoan(loan.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>

                    {/* Outstanding balance — the most important number */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white mb-4">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Current outstanding balance</p>
                      <p className="text-3xl font-black">₹{loan.outstanding.toLocaleString("en-IN")}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {s.isAccruing
                          ? `⚠ Balance growing — interest ₹${s.thisMonthInterest.toFixed(0)}/mo exceeds payment ₹${s.thisMonthPayment.toFixed(0)}/mo`
                          : `✓ Balance reducing — paying ₹${(s.thisMonthPayment - s.thisMonthInterest).toFixed(0)} principal/month`
                        }
                      </p>
                    </div>

                    {/* Next payment alert */}
                    <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border mb-4",
                      s.daysToNext < 0
                        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
                        : overdueOrSoon
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900"
                          : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900"
                    )}>
                      <Calendar className={cn("h-4 w-4 shrink-0",
                        s.daysToNext<0?"text-red-500":overdueOrSoon?"text-amber-500":"text-blue-500")}/>
                      <div className="flex-1">
                        <p className={cn("text-xs font-bold",
                          s.daysToNext<0?"text-red-700 dark:text-red-300":overdueOrSoon?"text-amber-700 dark:text-amber-300":"text-blue-700 dark:text-blue-300")}>
                          {s.daysToNext<0 ? `Payment overdue by ${Math.abs(s.daysToNext)} days`
                            : s.daysToNext===0 ? "Payment due TODAY"
                            : `Next payment in ${s.daysToNext} days`}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(s.nextDue,"dd MMM yyyy")} · ₹{loan.currentPayment.toLocaleString("en-IN")}
                          {" · "} Interest component: ₹{s.nextPaymentBreakdown.interest.toLocaleString("en-IN")}
                          {s.nextPaymentBreakdown.principal > 0
                            ? ` · Principal: ₹${s.nextPaymentBreakdown.principal.toLocaleString("en-IN")}`
                            : " · (all goes to interest — balance still growing)"}
                        </p>
                      </div>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400 shrink-0">
                        ₹{loan.currentPayment.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Key analytics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      {[
                        {l:"Monthly interest",  v:`₹${s.thisMonthInterest.toFixed(0)}`,            c:"text-red-500"},
                        {l:"Full EMI",          v:`₹${(loan.fullEmi||loan.currentPayment).toLocaleString("en-IN")}`, c:"text-blue-600 dark:text-blue-400"},
                        {l:"Months to payoff",  v:`${s.totalMonths}`,                               c:"text-amber-600 dark:text-amber-400"},
                        {l:"Payoff date",       v:format(s.payoffDate,"MMM yyyy"),                  c:"text-emerald-600 dark:text-emerald-400"},
                      ].map(st=>(
                        <div key={st.l} className="p-3 rounded-xl bg-muted/50 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{st.l}</p>
                          <p className={cn("text-sm font-black",st.c)}>{st.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Full EMI start info */}
                    {loan.fullEmiStartDate && (
                      <div className="p-3 rounded-xl bg-muted/40 border mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Currently paying</span>
                          <span className="font-semibold">₹{loan.currentPayment.toLocaleString("en-IN")}/month</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Full EMI starts</span>
                          <span className="font-semibold">{format(new Date(loan.fullEmiStartDate),"dd MMM yyyy")} · ₹{(loan.fullEmi||0).toLocaleString("en-IN")}/month</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1 border-t pt-1">
                          <span className="text-muted-foreground">Estimated total interest remaining</span>
                          <span className="font-semibold text-red-500">₹{s.totalInterest.toLocaleString("en-IN", {maximumFractionDigits:0})}</span>
                        </div>
                      </div>
                    )}

                    {/* Schedule toggle */}
                    <button onClick={()=>toggleExp(loan.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium py-2 transition-colors">
                      {isExp ? <><ChevronUp className="h-3.5 w-3.5"/>Hide projection</> : <><ChevronDown className="h-3.5 w-3.5"/>View month-by-month projection</>}
                    </button>
                  </div>

                  {/* CI schedule projection */}
                  {isExp && (
                    <div className="border-t overflow-x-auto">
                      <div className="px-4 py-3 bg-muted/30 text-[11px] text-muted-foreground">
                        Projection from today · balance_next = balance × (1 + r) − payment
                      </div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Month</th>
                            <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Payment</th>
                            <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Interest</th>
                            <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Principal</th>
                            <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {s.schedule.slice(0, 60).map((row) => {
                            const rowDate = new Date();
                            rowDate.setMonth(rowDate.getMonth() + row.month);
                            const prinPart = Math.max(0, row.payment - row.interest);
                            return (
                              <tr key={row.month}
                                className={cn(row.increasing ? "bg-red-50/50 dark:bg-red-950/20" : "")}>
                                <td className="px-4 py-2">{format(rowDate,"MMM yy")}</td>
                                <td className="px-4 py-2 text-right font-semibold">₹{row.payment.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-2 text-right text-red-500">₹{row.interest.toFixed(0)}</td>
                                <td className={cn("px-4 py-2 text-right", prinPart > 0 ? "text-emerald-600" : "text-muted-foreground/50")}>
                                  {prinPart > 0 ? `₹${prinPart.toFixed(0)}` : "—"}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold">₹{row.balance.toLocaleString("en-IN",{maximumFractionDigits:0})}</td>
                              </tr>
                            );
                          })}
                          {s.schedule.length > 60 && (
                            <tr className="bg-muted/20">
                              <td colSpan={5} className="px-4 py-2 text-center text-[10px] text-muted-foreground">
                                ... {s.schedule.length - 60} more months until payoff ({format(s.payoffDate,"MMM yyyy")})
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            }

            // ── STANDARD LOAN CARD ────────────────────────────
            const s = getReducingStats(loan);
            const emiOverdue = s.daysToNext < 0;
            const emiSoon    = !emiOverdue && s.daysToNext <= 5;

            return (
              <div key={loan.id} className="rounded-2xl border bg-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{loan.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{loan.name||loan.type}</p>
                        <p className="text-xs text-muted-foreground">{loan.type} · {loan.rate}% p.a. · {loan.months} months</p>
                      </div>
                    </div>
                    <button onClick={()=>deleteLoan(loan.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground">{s.monthsPaid} of {loan.months} payments made</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{s.pct.toFixed(1)}% paid off</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all"
                        style={{width:`${s.pct}%`}}/>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-muted-foreground">
                      <span>{fmt(s.prinPaid)} paid</span>
                      <span>{fmt(s.outstanding)} outstanding</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      {l:"Monthly EMI",  v:`${fmt(loan.emi)}`,         c:"text-blue-600 dark:text-blue-400"},
                      {l:"Outstanding",  v:`${fmt(s.outstanding)}`,    c:"text-red-500"},
                      {l:"Months left",  v:`${s.monthsLeft}`,                 c:"text-amber-600 dark:text-amber-400"},
                      {l:"Payoff date",  v:format(s.payoffDate,"MMM yyyy"),   c:"text-emerald-600 dark:text-emerald-400"},
                    ].map(st=>(
                      <div key={st.l} className="p-3 rounded-xl bg-muted/50 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">{st.l}</p>
                        <p className={cn("text-sm font-black",st.c)}>{st.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className={cn("flex items-center gap-3 p-3.5 rounded-xl border mb-4",
                    emiOverdue?"bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900"
                    :emiSoon?"bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900"
                    :"bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900")}>
                    <Calendar className={cn("h-4 w-4 shrink-0",emiOverdue?"text-red-500":emiSoon?"text-amber-500":"text-blue-500")}/>
                    <div className="flex-1">
                      <p className={cn("text-xs font-bold",emiOverdue?"text-red-700 dark:text-red-300":emiSoon?"text-amber-700 dark:text-amber-300":"text-blue-700 dark:text-blue-300")}>
                        {emiOverdue?`EMI overdue by ${Math.abs(s.daysToNext)} days`:s.daysToNext===0?"EMI due TODAY":`Next EMI in ${s.daysToNext} days`}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(s.nextEmiDate,"dd MMM yyyy")} · {fmt(loan.emi)}
                        {s.nextEmiRow && ` (principal ${fmt(s.nextEmiRow.principal)} + interest ${fmt(s.nextEmiRow.interest)})`}
                      </p>
                    </div>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 shrink-0">{fmt(loan.emi)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 font-semibold">Paid so far</p>
                      <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{fmt(s.totalPaid)}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Principal</span>
                          <span className="font-semibold">{fmt(s.prinPaid)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Interest</span>
                          <span className="font-semibold text-red-500">{fmt(s.intPaid)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                      <p className="text-[10px] text-red-700 dark:text-red-400 uppercase tracking-wide mb-2 font-semibold">Still to pay</p>
                      <p className="text-xl font-black text-red-600 dark:text-red-300">{fmt(s.totalRemain)}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Outstanding principal</span>
                          <span className="font-semibold">{fmt(s.outstanding)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Future interest</span>
                          <span className="font-semibold text-red-500">{fmt(s.futureInt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2">
                    <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Original loan</span><span className="font-semibold">{fmt(loan.principal)}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Total interest ({loan.rate}% p.a.)</span><span className="font-semibold text-red-500">{fmt(s.totalInterest)}</span></div>
                    <div className="flex justify-between text-[11px] font-bold border-t pt-2"><span>Total cost of loan</span><span>{fmt(s.totalPayable)}</span></div>
                  </div>

                  <button onClick={()=>toggleExp(loan.id)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium py-2 transition-colors">
                    {isExp?<><ChevronUp className="h-3.5 w-3.5"/>Hide schedule</>:<><ChevronDown className="h-3.5 w-3.5"/>View amortisation schedule</>}
                  </button>
                </div>

                {isExp && (
                  <div className="border-t overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead><tr className="bg-muted/50">
                        <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Month</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">EMI</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Principal</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Interest</th>
                        <th className="text-right px-4 py-2 font-semibold text-muted-foreground">Balance</th>
                      </tr></thead>
                      <tbody className="divide-y">
                        {buildReducingSchedule(loan.principal,loan.rate,loan.months).map(row=>{
                          const isPaid = row.month<=s.monthsPaid;
                          const isNext = row.month===s.monthsPaid+1;
                          const rowDate = new Date(loan.startDate);
                          rowDate.setMonth(rowDate.getMonth()+row.month);
                          return (
                            <tr key={row.month} className={cn(isPaid?"bg-emerald-50/50 dark:bg-emerald-950/20 text-muted-foreground":"",isNext?"bg-blue-50 dark:bg-blue-950/40 font-bold":"")}>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1.5">
                                  {isPaid&&<CheckCircle2 className="h-3 w-3 text-emerald-500"/>}
                                  {isNext&&<span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">NEXT</span>}
                                  <span>{format(rowDate,"MMM yy")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">{fmt(row.emi)}</td>
                              <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">{fmt(row.principal)}</td>
                              <td className="px-4 py-2 text-right text-red-500">{fmt(row.interest)}</td>
                              <td className="px-4 py-2 text-right font-semibold">{fmt(row.balance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="text-center py-12 rounded-2xl border border-dashed">
          <PiggyBank className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3"/>
          <p className="text-sm font-bold text-muted-foreground">No loans tracked yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add a home loan, education loan (Credila/HDFC CI), car finance or personal loan
          </p>
        </div>
      )}

      {!showForm && (
        <button onClick={()=>setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed hover:bg-muted/40 transition-colors text-sm text-muted-foreground hover:text-foreground font-medium">
          <Plus className="h-4 w-4"/>Add loan / EMI
        </button>
      )}
    </div>
  );
}