"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Repeat2, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/currency-utils";

const FREQ_COLORS = {
  weekly:      "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "bi-weekly": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  monthly:     "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  quarterly:   "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const CAT_COLORS = [
  "#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6",
  "#ec4899","#14b8a6","#f97316","#8b5cf6","#06b6d4",
];

export function SubscriptionTracker({ data }) {
  const { subscriptions, totalMonthly, totalAnnual } = data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Repeat2 className="h-4 w-4 text-blue-500" />
              Subscriptions &amp; Recurring
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Auto-detected from your transactions</p>
          </div>
          {totalMonthly > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-red-500">
                {fmt(totalMonthly)}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">{fmt(totalAnnual)}/year</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Repeat2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium">No recurring charges detected</p>
            <p className="text-xs text-muted-foreground mt-1">Add more transactions to detect subscriptions</p>
          </div>
        ) : (
          <>
            {totalMonthly > 300 && (
              <div className="flex gap-2 p-3 mb-4 rounded-xl bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-900 text-sm">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <span className="text-orange-700 dark:text-orange-300">
                  You&apos;re spending <strong>{fmt(totalMonthly)}/month</strong> on subscriptions. Review if all are still needed.
                </span>
              </div>
            )}

            <div className="space-y-2.5">
              {subscriptions.map((sub, i) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                  >
                    {(sub.name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 capitalize",
                          FREQ_COLORS[sub.frequency] || FREQ_COLORS.monthly
                        )}
                      >
                        {sub.frequency}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">{sub.category}</span>
                      {sub.occurrences > 1 && (
                        <span className="text-[10px] text-muted-foreground">{sub.occurrences}× detected</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{fmt(sub.amount)}</p>
                    {sub.frequency !== "monthly" && (
                      <p className="text-[10px] text-muted-foreground">{fmt(sub.monthlyEquivalent)}/mo</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Annual summary */}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Annual subscription cost
              </span>
              <span className="font-bold text-lg tabular-nums">{fmt(totalAnnual)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}