"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Lightbulb } from "lucide-react";

function getScoreColor(score) {
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  if (score >= 25) return "text-orange-500";
  return "text-red-500";
}

function getScoreLabel(score) {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 25) return "Fair";
  return "Needs Work";
}

function getScoreRingColor(score) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

function StatusIcon({ status }) {
  if (status === "excellent" || status === "good")
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "fair")
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export function HealthScoreCard({ data }) {
  const { totalScore, breakdown, tips } = data;
  const circumference = 2 * Math.PI * 54;
  const progress = (totalScore / 100) * circumference;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Score Ring */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Financial Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={getScoreRingColor(totalScore)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-bold", getScoreColor(totalScore))}>
                {totalScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="text-center">
            <p className={cn("text-xl font-bold", getScoreColor(totalScore))}>
              {getScoreLabel(totalScore)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on last 3 months of transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {breakdown.map((item) => {
              const pct = (item.score / item.max) * 100;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={item.status} />
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        — {item.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      <span className={getScoreColor((item.score / item.max) * 100)}>
                        {item.score}
                      </span>
                      <span className="text-muted-foreground">/{item.max}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getScoreRingColor((item.score / item.max) * 100),
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
