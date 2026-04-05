"use client";

import { useState } from "react";
import { seedDemoTransactions } from "@/actions/seed-demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database, CheckCircle2, Loader2, Sparkles, RefreshCw,
  TrendingUp, AlertTriangle, Repeat2, Calendar, Brain,
  Shield, Target, BarChart3, Home, Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Repeat2,      label: "Subscription Detection",   desc: "9 fixed subs (Netflix, Spotify, Disney+, Apple TV+, Gym, LinkedIn, Aviva, Vodafone, Eir) — identical amounts every month", color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-950"   },
  { icon: AlertTriangle,label: "Anomaly Detection",         desc: "Food spend 3.2× normal in month 3 — should flag as HIGH severity anomaly", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950" },
  { icon: Calendar,     label: "Weekend vs Weekday",        desc: "Extra food + shopping added on every Saturday & Sunday", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
  { icon: TrendingUp,   label: "Expense Forecasting",       desc: "6 months of consistent data — linear regression forecast fully calculable", color: "text-green-500",  bg: "bg-green-50 dark:bg-green-950"  },
  { icon: Shield,       label: "Financial Health Score",    desc: "Savings rate, budget compliance and spending consistency all populated", color: "text-teal-500",  bg: "bg-teal-50 dark:bg-teal-950"   },
  { icon: Brain,        label: "Emergency Fund Calculator", desc: "3–6 months of expense data gives accurate fund target", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950" },
  { icon: Home,         label: "Cost of Living Tracker",    desc: "Housing, food, transport, utilities seeded every month", color: "text-rose-500",   bg: "bg-rose-50 dark:bg-rose-950"    },
  { icon: Lightbulb,    label: "AI Saving Suggestions",     desc: "Food and entertainment overspending present — AI tips will trigger", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
  { icon: Target,       label: "Budget vs Actual",          desc: "Budget auto-set at 110% of average spend — realistic over/under months", color: "text-cyan-500",  bg: "bg-cyan-50 dark:bg-cyan-950"   },
  { icon: BarChart3,    label: "Smart Budget Recommendation",desc: "Income + per-category history ready for 50/30/20 recommendation", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950"},
];

export function SeedPage() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const run = async () => {
    setStatus("loading");
    setError(null);
    try {
      const r = await seedDemoTransactions();
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-2">
          <Database className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Load Demo Data</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Seeds 6 months of realistic transactions designed to test every chart and AI feature on the analytics and dashboard pages.
        </p>
      </div>

      {/* What gets seeded */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Features covered by this dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FEATURES.map((f) => (
            <div key={f.label} className={cn("flex gap-3 p-3 rounded-xl", f.bg)}>
              <f.icon className={cn("h-4 w-4 mt-0.5 shrink-0", f.color)} />
              <div>
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          className="w-full max-w-xs h-12 text-base gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          onClick={run}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Seeding data...</>
          ) : status === "done" ? (
            <><RefreshCw className="h-5 w-5" />Re-seed fresh data</>
          ) : (
            <><Database className="h-5 w-5" />Seed demo transactions</>
          )}
        </Button>
        {status === "idle" && (
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ This will clear existing transactions and replace with demo data.<br />
            Your savings goals will be preserved.
          </p>
        )}
      </div>

      {/* Error */}
      {status === "error" && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-5">
            <p className="text-sm text-red-600 font-semibold mb-1">Seeding failed</p>
            <p className="text-xs text-muted-foreground font-mono">{error}</p>
            {error?.includes("account") && (
              <p className="text-xs text-amber-600 mt-2">
                💡 Go to{" "}
                <Link href="/dashboard" className="underline font-medium">Dashboard</Link>
                {" "}and create an account first, then come back here.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {status === "done" && result && (
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {result.transactions} transactions seeded successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Months", val: result.summary?.months ?? "6" },
                { label: "Income", val: result.summary?.income ?? "—" },
                { label: "Expense", val: result.summary?.expense ?? "—" },
                { label: "Net", val: result.summary?.net ?? "—" },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-sm font-bold">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Budget */}
            <p className="text-xs text-muted-foreground">
              Budget auto-set to <span className="font-semibold text-foreground">{result.summary?.budget ?? "—"}</span>
            </p>

            {/* Feature validation checklist */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Feature validation</p>
              <div className="space-y-1.5">
                {Object.entries(result.featuresValidated || {}).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Go to pages */}
            <div className="flex gap-3 flex-wrap pt-2">
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />View Dashboard
                </Button>
              </Link>
              <Link href="/analytics">
                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                  <BarChart3 className="h-3.5 w-3.5" />View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}