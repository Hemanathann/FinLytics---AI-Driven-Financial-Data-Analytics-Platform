import { getAnalyticsData } from "@/actions/analytics";
import { getHealthScore } from "@/actions/health-score";
import { detectAnomalies } from "@/actions/anomaly-detection";
import { getSpendingForecast } from "@/actions/spending-forecast";
import { getAllAIInsights } from "@/actions/unified-ai";
import { getEmergencyFundData, getCostOfLivingData } from "@/actions/financial-features";
import { ExportButton } from "@/components/export-button";
import { StatsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";

import {
  AnalyticsStats, MonthlyOverviewChart, CategoryBreakdownChart,
  SpendingHeatmap, TopMerchantsCard, HealthScoreCard, ForecastChart,
  AnomalyAlerts, AIInsightsCard, WeeklyTrendChart, TopCategoriesCard,
} from "./_components/all-charts";

import {
  EmergencyFundCard, AISavingSuggestionsCard,
  SmartBudgetCard, CostOfLivingCard,
} from "./_components/financial-feature-cards";

// ─── Section divider with gradient accent ──────────────────────
function Section({ accent, label, icon: Icon, description, children }) {
  const accents = {
    purple: { grad: "from-purple-500 to-violet-500", text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40" },
    green:  { grad: "from-emerald-500 to-green-500",  text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40" },
    blue:   { grad: "from-blue-500 to-cyan-500",      text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40" },
    indigo: { grad: "from-indigo-500 to-blue-500",    text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40" },
    pink:   { grad: "from-pink-500 to-rose-500",      text: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40 border-pink-200/60 dark:border-pink-800/40" },
    amber:  { grad: "from-amber-500 to-orange-500",   text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40" },
    teal:   { grad: "from-teal-500 to-green-500",     text: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/60 dark:border-teal-800/40" },
    red:    { grad: "from-red-500 to-rose-500",       text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-800/40" },
  };
  const a = accents[accent] || accents.blue;

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={`h-7 w-1.5 rounded-full bg-gradient-to-b ${a.grad} shrink-0`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className={`inline-flex w-6 h-6 rounded-lg bg-gradient-to-br ${a.grad} items-center justify-center`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </span>
            )}
            <h2 className="text-lg font-bold tracking-tight">{label}</h2>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-0.5 ml-8">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function AnalyticsPage() {
  const [data, healthData, anomalyData, forecastData, emergencyFundData, costOfLivingData] =
    await Promise.all([
      getAnalyticsData(), getHealthScore(), detectAnomalies(),
      getSpendingForecast(), getEmergencyFundData(), getCostOfLivingData(),
    ]);

  const aiData = await getAllAIInsights();

  const insightsData = {
    insights: aiData.insights,
    narrative: aiData.insightNarrative,
  };
  const savingSuggestionsData = {
    suggestions: aiData.suggestions,
    totalPotentialSavings: aiData.totalPotentialSavings,
    avgMonthlyExpense: aiData.avgMonthlyExpense,
  };
  const smartBudgetData = {
    recommendations: aiData.recommendations,
    avgMonthlyIncome: aiData.avgMonthlyIncome,
    totalExpense: aiData.totalExpense,
    savingsTarget: aiData.savingsTarget,
    narrative: aiData.budgetNarrative,
    hasBudget: aiData.hasBudget,
    rule: "50/30/20",
  };

  return (
    <div className="pb-24 max-w-7xl mx-auto px-3 sm:px-6 space-y-12">

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-6 sm:p-8 mt-2">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300/80 mb-2">
              FinLytics · Financial Intelligence
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Analytics
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300 text-2xl sm:text-3xl font-bold mt-1">
                All your finances, at a glance
              </span>
            </h1>
            <p className="text-blue-200/70 mt-3 text-sm max-w-md leading-relaxed">
              AI-powered insights in EUR · Charts refresh on every visit · All amounts in Euro (€)
            </p>
          </div>
          <ExportButton className="self-start sm:self-auto shrink-0" />
        </div>
      </div>

      {/* ── STATS ROW ─────────────────────────────────────────── */}
      <Suspense fallback={<StatsSkeleton />}>
        <AnalyticsStats stats={data.stats} />
      </Suspense>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — VISUAL CHARTS (easy to read at a glance)
          ══════════════════════════════════════════════════════ */}

      <Section
        accent="blue"
        label="Income & Expenses"
        description="Monthly performance overview — grouped, stacked, or net savings view"
      >
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MonthlyOverviewChart monthlySummary={data.monthlySummary} />
          </div>
          <CategoryBreakdownChart categoryBreakdown={data.categoryBreakdown} />
        </div>
      </Section>

      <Section
        accent="indigo"
        label="Weekly Trends & Top Categories"
        description="Week-by-week spending patterns and your highest-cost categories"
      >
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <WeeklyTrendChart weeklyData={data.weeklyData} />
          <TopCategoriesCard topCategories={data.topCategories} />
        </div>
      </Section>

      <Section
        accent="indigo"
        label="Spending Calendar"
        description="Day-by-day heatmap of your spending activity over the past 3 months"
      >
        <SpendingHeatmap heatmapData={data.heatmapData} />
      </Section>

      <Section
        accent="pink"
        label="Expense Forecasting"
        description="AI-powered prediction of next month's expenses using linear regression"
      >
        <ForecastChart data={forecastData} />
      </Section>

      <Section
        accent="amber"
        label="AI Expense Breakdown"
        description="Your top merchants ranked by total spend"
      >
        <TopMerchantsCard topMerchants={data.topMerchants} />
      </Section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — SMART INSIGHTS (AI + Anomalies)
          ══════════════════════════════════════════════════════ */}

      <Section
        accent="purple"
        label="Smart Financial Insights"
        description="Gemini AI analysis of your spending patterns and unusual transactions"
      >
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <AIInsightsCard data={insightsData} />
          <AnomalyAlerts data={anomalyData} />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — FINANCIAL HEALTH & PLANNING
          ══════════════════════════════════════════════════════ */}

      <Section
        accent="green"
        label="Financial Health Score"
        description="Holistic view of your financial wellbeing based on the last 3 months"
      >
        <HealthScoreCard data={healthData} />
      </Section>

      <Section
        accent="teal"
        label="Financial Safety Net"
        description="Emergency fund status and AI-driven tips to increase your savings"
      >
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          <EmergencyFundCard data={emergencyFundData} />
          <AISavingSuggestionsCard data={savingSuggestionsData} />
        </div>
      </Section>

      <Section
        accent="indigo"
        label="Smart Budget Recommendation"
        description="Personalised budget allocation using the 50/30/20 rule"
      >
        <SmartBudgetCard data={smartBudgetData} />
      </Section>

      <Section
        accent="purple"
        label="Cost of Living Tracker"
        description="How your spending compares to typical living costs in your area"
      >
        <CostOfLivingCard data={costOfLivingData} />
      </Section>
    </div>
  );
}