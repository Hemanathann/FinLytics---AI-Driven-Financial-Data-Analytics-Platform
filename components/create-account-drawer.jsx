"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ChevronDown } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerContent, DrawerHeader,
  DrawerTitle, DrawerTrigger, DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code:"USD", symbol:"$", flag:"🇺🇸", name:"US Dollar" },
  { code:"INR", symbol:"₹", flag:"🇮🇳", name:"Indian Rupee" },
  { code:"EUR", symbol:"€", flag:"🇮🇪", name:"Euro" },
  { code:"GBP", symbol:"£", flag:"🇬🇧", name:"British Pound" },
];

export function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const {
    register, handleSubmit, formState: { errors },
    setValue, watch, reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { name:"", type:"CURRENT", balance:"", isDefault:false },
  });

  const { loading, fn: createAccountFn, error, data: newAccount } = useFetch(createAccount);

  const onSubmit = async (data) => {
    // Embed currency code in the account name so we can read it back
    // Format: "[USD] My Account"
    await createAccountFn({ ...data, name: `[${currency}] ${data.name}` });
  };

  useEffect(() => {
    if (newAccount) {
      toast.success("Account created successfully!");
      reset(); setCurrency("USD");
      setOpen(false);
    }
  }, [newAccount]);

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to create account");
  }, [error]);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const sym = selectedCurrency?.symbol || "$";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-xl font-black">Create New Account</DrawerTitle>
          <p className="text-sm text-muted-foreground">Add a bank account, savings account or investment account</p>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-5">

          {/* ── Currency selector ────────────────────────────── */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Currency
            </label>
            <div className="relative">
              <button type="button" onClick={() => setShowCurrencyPicker(v => !v)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{selectedCurrency?.flag}</span>
                  <div className="text-left">
                    <p className="font-bold">{selectedCurrency?.code} — {selectedCurrency?.symbol}</p>
                    <p className="text-xs text-muted-foreground">{selectedCurrency?.name}</p>
                  </div>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showCurrencyPicker && "rotate-180")} />
              </button>

              {showCurrencyPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-2xl shadow-xl overflow-hidden z-50">
                  {CURRENCIES.map(c => (
                    <button key={c.code} type="button"
                      onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left border-b last:border-0",
                        currency === c.code && "bg-blue-50 dark:bg-blue-950/50"
                      )}>
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="text-sm font-bold">{c.code} <span className="text-muted-foreground font-normal">({c.symbol})</span></p>
                        <p className="text-xs text-muted-foreground">{c.name}</p>
                      </div>
                      {currency === c.code && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Account name */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Account Name
              </label>
              <Input placeholder="e.g. HDFC Savings, AIB Current" {...register("name")}
                className="rounded-xl h-12" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Account type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Account Type
              </label>
              <Select onValueChange={v => setValue("type", v)} defaultValue={watch("type")}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current / Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
            </div>

            {/* Initial balance */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Opening Balance
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                  {sym}
                </span>
                <Input type="number" step="0.01" placeholder="0.00" {...register("balance")}
                  className="pl-9 rounded-xl h-12" />
              </div>
              {errors.balance && <p className="text-xs text-red-500 mt-1">{errors.balance.message}</p>}
            </div>

            {/* Default toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl border bg-muted/20">
              <div>
                <p className="text-sm font-semibold">Set as Default</p>
                <p className="text-xs text-muted-foreground">Used automatically for new transactions</p>
              </div>
              <Switch checked={watch("isDefault")}
                onCheckedChange={v => setValue("isDefault", v)} />
            </div>

            <div className="flex gap-3 pt-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1 rounded-xl h-12">Cancel</Button>
              </DrawerClose>
              <Button type="submit" disabled={loading} className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating…</> : "Create Account"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}