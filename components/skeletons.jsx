import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Base skeleton pulse ────────────────────────────────────────
function Sk({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

// ── Card skeleton wrapper ──────────────────────────────────────
function SkCard({ children, className }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 space-y-2">
        <Sk className="h-4 w-32" />
        <Sk className="h-3 w-24" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD SKELETONS
// ══════════════════════════════════════════════════════════════

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="pt-4 pb-4">
            <Sk className="w-9 h-9 rounded-xl mb-3" />
            <Sk className="h-3 w-20 mb-2" />
            <Sk className="h-6 w-24 mb-1" />
            <Sk className="h-2.5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function BudgetProgressSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <Sk className="h-5 w-40" />
          <Sk className="h-8 w-20 rounded-lg" />
        </div>
        <Sk className="h-3 w-full rounded-full mb-2" />
        <div className="flex justify-between">
          <Sk className="h-3 w-24" />
          <Sk className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Sk className="h-5 w-32" />
          <Sk className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Sk className="h-8 w-40 mb-3" />
        <div className="flex justify-between">
          <Sk className="h-3 w-20" />
          <Sk className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function NetWorthSkeleton() {
  return (
    <SkCard>
      <Sk className="h-8 w-48 mb-4" />
      <Sk className="h-40 w-full rounded-xl mb-4" />
      <div className="space-y-2 pt-4 border-t">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <Sk className="h-4 w-32" />
            <Sk className="h-4 w-24" />
          </div>
        ))}
      </div>
    </SkCard>
  );
}

export function StreakSkeleton() {
  return (
    <SkCard>
      <Sk className="h-36 w-full rounded-2xl mb-4" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Sk className="h-20 rounded-xl" />
        <Sk className="h-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }).map((_, i) => (
          <Sk key={i} className="h-7 rounded-lg" />
        ))}
      </div>
    </SkCard>
  );
}

export function SavingsGoalsSkeleton() {
  return (
    <SkCard>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 rounded-xl border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Sk className="w-8 h-8 rounded-lg" />
                <div>
                  <Sk className="h-4 w-28 mb-1" />
                  <Sk className="h-3 w-20" />
                </div>
              </div>
              <Sk className="h-6 w-20 rounded-full" />
            </div>
            <Sk className="h-2.5 w-full rounded-full mb-2" />
            <div className="flex gap-4">
              <Sk className="h-3 w-16" />
              <Sk className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </SkCard>
  );
}

export function SubscriptionSkeleton() {
  return (
    <SkCard>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
            <Sk className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1">
              <Sk className="h-4 w-32 mb-1" />
              <Sk className="h-3 w-20" />
            </div>
            <Sk className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </SkCard>
  );
}

export function BudgetVsActualSkeleton() {
  return (
    <SkCard>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => <Sk key={i} className="h-16 rounded-xl" />)}
      </div>
      <Sk className="h-3 w-full rounded-full mb-4" />
      <Sk className="h-48 w-full rounded-xl" />
    </SkCard>
  );
}

// ══════════════════════════════════════════════════════════════
//  ANALYTICS SKELETONS
// ══════════════════════════════════════════════════════════════

export function ChartSkeleton({ height = 260 }) {
  return (
    <SkCard>
      <Sk className={`w-full rounded-xl`} style={{ height }} />
      <div className="flex gap-4 mt-3 pt-3 border-t">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Sk className="h-3 w-20 mb-1" />
            <Sk className="h-5 w-16" />
          </div>
        ))}
      </div>
    </SkCard>
  );
}

export function HeatmapSkeleton() {
  return (
    <SkCard>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {Array.from({ length: 12 }).map((_, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => (
              <Sk key={di} className="w-[14px] h-[14px] rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </SkCard>
  );
}

export function InsightsSkeleton() {
  return (
    <SkCard>
      <Sk className="h-24 w-full rounded-xl mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Sk key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    </SkCard>
  );
}

export function HealthScoreSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            {i === 1 ? (
              <div className="flex flex-col items-center gap-3">
                <Sk className="w-36 h-36 rounded-full" />
                <Sk className="h-6 w-24" />
                <Sk className="h-3 w-32" />
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <Sk className="h-3 w-24" />
                      <Sk className="h-3 w-16" />
                    </div>
                    <Sk className="h-1.5 w-full rounded-full" />
                    <Sk className="h-2.5 w-40 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Full dashboard skeleton (wraps everything) ─────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <BudgetProgressSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <AccountCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <NetWorthSkeleton />
        <StreakSkeleton />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <SavingsGoalsSkeleton />
        <BudgetVsActualSkeleton />
      </div>
    </div>
  );
}

// ── Full analytics skeleton ────────────────────────────────────
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4">
      <div className="flex items-start justify-between">
        <div>
          <Sk className="h-12 w-48 mb-2" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-24 rounded-lg mt-1" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-5 md:grid-cols-2">
        <InsightsSkeleton />
        <ChartSkeleton height={200} />
      </div>
      <HealthScoreSkeleton />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartSkeleton height={280} /></div>
        <ChartSkeleton height={280} />
      </div>
      <ChartSkeleton height={220} />
      <HeatmapSkeleton />
    </div>
  );
}