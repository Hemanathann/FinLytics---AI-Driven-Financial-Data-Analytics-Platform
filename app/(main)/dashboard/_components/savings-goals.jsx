"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, CheckCircle2, TrendingUp, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/currency-utils";
import { createSavingsGoal, deleteSavingsGoal } from "@/actions/savings-goals";
import { toast } from "sonner";

const GOAL_EMOJIS = ["🎯","🏠","✈️","🚗","💻","📚","💍","🎓","🏖️","💪"];
const GOAL_COLORS = ["#6366f1","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];

function GoalForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", targetAmount: "", targetDate: "",
    emoji: "🎯", color: "#6366f1",
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name || !form.targetAmount || !form.targetDate) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await createSavingsGoal(form);
      toast.success("Goal created!");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">New Savings Goal</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_EMOJIS.map((e) => (
                <button key={e} onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={cn("w-9 h-9 rounded-xl text-lg transition-all",
                    form.emoji === e ? "bg-primary/20 ring-2 ring-primary scale-110" : "bg-muted hover:bg-muted/80")}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Colour</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((c) => (
                <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn("w-7 h-7 rounded-full transition-all",
                    form.color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Goal name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Emergency fund, Holiday in Japan…"
              className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target amount (€)</label>
              <input
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                placeholder="5000"
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target date</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? "Creating…" : "Create Goal"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SavingsGoalsCard({ initialGoals }) {
  const [goals, setGoals] = useState(initialGoals || []);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const refresh = async () => {
    window.location.reload();
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteSavingsGoal(id);
      setGoals((g) => g.filter((x) => x.id !== id));
      toast.success("Goal deleted");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {showForm && <GoalForm onClose={() => setShowForm(false)} onCreated={refresh} />}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                Savings Goals
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {goals.filter((g) => g.completed).length} of {goals.length} completed
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-2xl">🎯</div>
              <div>
                <p className="text-sm font-medium">No goals yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Set a savings target and track your progress</p>
              </div>
              <Button size="sm" onClick={() => setShowForm(true)} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" />Create your first goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-xl border bg-muted/30">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Target: <span className="font-medium">{fmt(goal.targetAmount)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.completed ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={cn("gap-1 text-xs", goal.onTrack ? "text-green-600 border-green-200" : "text-orange-600 border-orange-200")}>
                          {goal.onTrack ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {goal.onTrack ? "On track" : "Behind"}
                        </Badge>
                      )}
                      <button
                        onClick={() => handleDelete(goal.id)}
                        disabled={deleting === goal.id}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        Saved: <span className="font-semibold text-foreground">{fmt(goal.currentSaved)}</span>
                      </span>
                      <span className="font-medium" style={{ color: goal.color }}>{goal.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${goal.progress}%`, background: goal.color }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  {!goal.completed && (
                    <div className="flex gap-4 mt-2.5 text-xs text-muted-foreground flex-wrap">
                      <span><span className="font-medium text-foreground">{fmt(goal.remaining)}</span> to go</span>
                      <span><span className="font-medium text-foreground">{goal.daysLeft}d</span> left</span>
                      <span>Need <span className="font-medium text-foreground">{fmt(goal.monthlyNeeded)}/mo</span></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}