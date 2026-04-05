"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownRight, ArrowUpRight, CalendarIcon, Loader2,
  ScanLine, Sparkles, RefreshCw, ChevronDown, Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";
import useFetch from "@/hooks/use-fetch";

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

const TYPE_CONFIG = {
  EXPENSE: {
    label: "Expense",
    icon: ArrowDownRight,
    gradient: "from-red-500 to-rose-600",
    light: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    ring: "ring-red-400",
    accent: "#ef4444",
  },
  INCOME: {
    label: "Income",
    icon: ArrowUpRight,
    gradient: "from-green-500 to-emerald-600",
    light: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    ring: "ring-green-400",
    accent: "#22c55e",
  },
};

export function AddTransactionForm({
  accounts, categories, editMode = false, initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [calOpen, setCalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const {
    register, handleSubmit, formState: { errors }, watch,
    setValue, getValues, reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: editMode && initialData ? {
      type:              initialData.type,
      amount:            initialData.amount.toString(),
      description:       initialData.description,
      accountId:         initialData.accountId,
      category:          initialData.category,
      date:              new Date(initialData.date),
      isRecurring:       initialData.isRecurring,
      ...(initialData.recurringInterval && { recurringInterval: initialData.recurringInterval }),
    } : {
      type:        "EXPENSE",
      amount:      "",
      description: "",
      accountId:   accounts.find((a) => a.isDefault)?.id,
      date:        new Date(),
      isRecurring: false,
    },
  });

  const { loading, fn: transactionFn, data: result, error } = useFetch(
    editMode ? updateTransaction : createTransaction
  );

  const type        = watch("type");
  const isRecurring = watch("isRecurring");
  const date        = watch("date");
  const amount      = watch("amount");
  const accountId   = watch("accountId");
  const category    = watch("category");

  const cfg           = TYPE_CONFIG[type];
  const filteredCats  = categories.filter((c) => c.type === type || !c.type);
  const selectedAcct  = accounts.find((a) => a.id === accountId);
  const selectedCat   = categories.find((c) => c.id === category);

  useEffect(() => {
    if (result?.success && !loading) {
      toast.success(editMode ? "Transaction updated" : "Transaction added");
      reset();
      router.push(`/account/${result.data.accountId}`);
    }
  }, [result, loading]);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  const onSubmit = (data) => {
    const payload = { ...data, amount: parseFloat(data.amount) };
    editMode ? transactionFn(editId, payload) : transactionFn(payload);
  };

  const handleScan = (data) => {
    if (data.amount)      setValue("amount", data.amount.toString());
    if (data.date)        setValue("date", new Date(data.date));
    if (data.description) setValue("description", data.description);
    if (data.category)    setValue("category", data.category);
    setShowScanner(false);
    toast.success("Receipt scanned!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${cfg.accent}dd, ${cfg.accent}99)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:"radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize:"20px 20px" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black tracking-tight">
              {editMode ? "Edit Transaction" : "Add Transaction"}
            </h1>
            {!editMode && (
              <button onClick={() => setShowScanner(true)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-3 py-2 text-sm font-medium transition-colors">
                <ScanLine className="h-4 w-4" />Scan receipt
              </button>
            )}
          </div>

          {/* Type toggle */}
          <div className="flex gap-2">
            {["EXPENSE","INCOME"].map((t) => {
              const c = TYPE_CONFIG[t];
              const Icon = c.icon;
              return (
                <button key={t} onClick={() => { setValue("type", t); setValue("category", ""); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                    type === t ? "bg-white text-gray-800 shadow-lg" : "bg-white/20 hover:bg-white/30"
                  )}>
                  <Icon className="h-4 w-4" />{c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showScanner && (
        <div className="mb-4">
          <ReceiptScanner onScanComplete={handleScan} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── AMOUNT ──────────────────────────────────────────── */}
        <div className="p-5 rounded-2xl border bg-card">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-muted-foreground/50">$</span>
            <input
              {...register("amount")}
              type="number" step="0.01" placeholder="0.00"
              className={cn(
                "w-full pl-10 pr-4 py-4 text-4xl font-black bg-transparent outline-none border-b-2 transition-colors",
                errors.amount ? "border-red-400" : "border-muted focus:border-blue-500"
              )}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          {/* Quick amounts */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {QUICK_AMOUNTS.map((q) => (
              <button key={q} type="button" onClick={() => setValue("amount", q.toString())}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                  amount === q.toString()
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-muted hover:bg-muted/80 border-transparent"
                )}>
                ${q}
              </button>
            ))}
          </div>
        </div>

        {/* ── DESCRIPTION ─────────────────────────────────────── */}
        <div className="p-5 rounded-2xl border bg-card">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Description</label>
          <input
            {...register("description")}
            placeholder="What was this for? (optional)"
            className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* ── CATEGORY ────────────────────────────────────────── */}
        <div className="p-5 rounded-2xl border bg-card">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Category</label>
          {errors.category && <p className="text-xs text-red-500 mb-2">{errors.category.message}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredCats.map((cat) => (
              <button key={cat.id} type="button" onClick={() => setValue("category", cat.id)}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium transition-all border text-left",
                  category === cat.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}>
                <span className="text-base">{cat.icon === "Wallet" ? "💰" : cat.icon === "TrendingUp" ? "📈" : cat.icon === "Home" ? "🏠" : cat.icon === "Car" ? "🚗" : cat.icon === "Shopping" ? "🛒" : cat.icon === "Zap" ? "⚡" : cat.icon === "Film" ? "🎬" : cat.icon === "UtensilsCrossed" ? "🍽️" : cat.icon === "ShoppingBag" ? "🛍️" : cat.icon === "HeartPulse" ? "❤️" : cat.icon === "GraduationCap" ? "🎓" : cat.icon === "Plane" ? "✈️" : cat.icon === "Shield" ? "🛡️" : cat.icon === "Gift" ? "🎁" : cat.icon === "Receipt" ? "📄" : cat.icon === "ArrowLeftRight" ? "💱" : "•"}</span>
                <span className="truncate text-xs">{cat.name}</span>
                {category === cat.id && <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── DATE + ACCOUNT ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Date */}
          <div className="p-5 rounded-2xl border bg-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Date</label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <button type="button"
                  className="w-full flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 text-sm text-left hover:bg-muted transition-colors">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {date ? format(date, "dd MMM yyyy") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { setValue("date", d); setCalOpen(false); } }}
                  disabled={(d) => d > new Date() || d < new Date("2000-01-01")} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          {/* Account */}
          <div className="p-5 rounded-2xl border bg-card">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Account</label>
            <div className="space-y-1.5">
              {accounts.map((acc) => (
                <button key={acc.id} type="button" onClick={() => setValue("accountId", acc.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all border",
                    accountId === acc.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}>
                  <span>{acc.name}</span>
                  <span className="text-xs text-muted-foreground">${Number(acc.balance).toFixed(0)}</span>
                </button>
              ))}
              <CreateAccountDrawer>
                <button type="button" className="w-full p-3 rounded-xl text-xs text-muted-foreground border border-dashed hover:bg-muted/50 transition-colors">
                  + New account
                </button>
              </CreateAccountDrawer>
            </div>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId.message}</p>}
          </div>
        </div>

        {/* ── RECURRING ───────────────────────────────────────── */}
        <div className="p-5 rounded-2xl border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Recurring transaction</p>
                <p className="text-xs text-muted-foreground">Automatically log this periodically</p>
              </div>
            </div>
            <Switch checked={isRecurring} onCheckedChange={(v) => setValue("isRecurring", v)} />
          </div>

          {isRecurring && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t">
              {["DAILY","WEEKLY","MONTHLY","YEARLY"].map((interval) => {
                const cur = watch("recurringInterval");
                const labels = { DAILY:"Daily", WEEKLY:"Weekly", MONTHLY:"Monthly", YEARLY:"Yearly" };
                return (
                  <button key={interval} type="button" onClick={() => setValue("recurringInterval", interval)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-all",
                      cur === interval
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    )}>
                    {labels[interval]}
                  </button>
                );
              })}
              {errors.recurringInterval && (
                <p className="col-span-4 text-xs text-red-500">{errors.recurringInterval.message}</p>
              )}
            </div>
          )}
        </div>

        {/* ── SUBMIT ──────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1 h-12 rounded-2xl"
            onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}
            className={cn("flex-1 h-12 rounded-2xl font-bold text-base text-white",
              `bg-gradient-to-r ${cfg.gradient} hover:opacity-90 transition-opacity`
            )}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : editMode ? "Update Transaction" : `Add ${cfg.label}`}
          </Button>
        </div>
      </form>
    </div>
  );
}