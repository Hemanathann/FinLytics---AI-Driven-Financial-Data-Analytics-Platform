"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, Send, Loader2, User, BarChart2,
  ChevronRight, TrendingUp, Target,
  CreditCard, Lightbulb, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithFinanceAI } from "@/actions/finance-chat";

// ── Suggested question categories ─────────────────────────────
const CATEGORIES = [
  {
    label: "Spending",
    icon: CreditCard,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/60",
    questions: [
      "Where am I overspending the most?",
      "What's my biggest expense category?",
      "How does my spending compare month to month?",
      "Which merchants do I spend at most often?",
    ],
  },
  {
    label: "Savings",
    icon: Target,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    questions: [
      "How can I save more money each month?",
      "What is my current savings rate?",
      "Which expenses can I cut to save more?",
      "Am I on track financially?",
    ],
  },
  {
    label: "Insights",
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    questions: [
      "Give me a full summary of my finances",
      "What financial habits should I change?",
      "Am I over my budget this month?",
      "What would you recommend I do differently?",
    ],
  },
  {
    label: "Trends",
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    questions: [
      "Is my spending increasing or decreasing?",
      "What month did I spend the most?",
      "What's my forecast for next month?",
      "Which day of the week do I spend the most?",
    ],
  },
];

const QUICK = ["Summarise finances", "Top expense?", "How to save more?", "Budget status?", "Travel spend?"];

const WELCOME = "Hi! I'm the FinLytics AI advisor — I have full access to your real transaction data.\n\nPick a question below or ask anything about your finances.";

// ── Message renderer ───────────────────────────────────────────
function MessageContent({ content }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {content.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("• ") || line.startsWith("- "))
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
              <span>{line.slice(2)}</span>
            </div>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-[11px] font-semibold opacity-50 shrink-0 mt-0.5">{line.match(/^(\d+)/)[1]}.</span>
              <span>{line.replace(/^\d+\.\s/, "")}</span>
            </div>
          );
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0">
        <BarChart2 className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function FinanceChatbot() {
  const [open,    setOpen]    = useState(false);
  const [view,    setView]    = useState("home"); // "home" | "chat"
  const [msgs,    setMsgs]    = useState([{ role: "assistant", content: WELCOME, isWelcome: true }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (view === "chat") {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [msgs, loading, view]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, view]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput("");
    setView("chat");
    const userMsg = { role: "user", content: msg };
    setMsgs((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Pass only real conversation history (exclude welcome message)
      const history = msgs.filter((m) => !m.isWelcome && !m.isError);
      const reply = await chatWithFinanceAI(msg, history);
      setMsgs((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      // FIX: show error inline in chat, keep user message visible
      const errorText = err?.message || "Something went wrong. Please try again.";
      setMsgs((prev) => [...prev, {
        role: "assistant",
        content: `⚠️ ${errorText}`,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMsgs([{ role: "assistant", content: WELCOME, isWelcome: true }]);
    setView("home");
    setInput("");
  };

  return (
    <>
      {/* ── FAB button ─────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center shadow-2xl transition-all duration-200",
          open
            ? "w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 justify-center"
            : "h-12 px-4 rounded-2xl bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-600 hover:to-teal-500 text-white gap-2.5 hover:scale-[1.02] active:scale-95"
        )}
        aria-label="FinLytics AI"
      >
        {open ? (
          <X className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        ) : (
          <>
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <BarChart2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Ask FinLytics AI</span>
            <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
          </>
        )}
      </button>

      {/* ── Chat window ────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-6 z-50 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-background flex flex-col overflow-hidden"
          style={{ width: "min(400px, calc(100vw - 2rem))", maxHeight: "calc(100vh - 6rem)", minHeight: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-teal-600 text-white shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm tracking-tight">
                <span className="text-white/75">Fin</span>Lytics AI
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                <p className="text-[11px] text-white/65">Online · GROQ </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {view === "chat" && (
                <button onClick={reset}
                  className="text-[11px] bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full font-medium transition-colors">
                  New chat
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="hover:bg-white/15 rounded-lg p-1.5 transition-colors ml-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* HOME view */}
            {view === "home" && (
              <div className="p-4 space-y-4">
                {/* Welcome bubble */}
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                    <MessageContent content={WELCOME} />
                  </div>
                </div>

                {CATEGORIES.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center gap-2 mb-2 px-0.5">
                      <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center", cat.bg)}>
                        <cat.icon className={cn("h-3 w-3", cat.color)} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{cat.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {cat.questions.map((q) => (
                        <button key={q} onClick={() => send(q)}
                          className="w-full text-left text-xs px-3.5 py-2.5 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/40 transition-all group flex items-center justify-between gap-2">
                          <span className="leading-snug">{q}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 shrink-0 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CHAT view */}
            {view === "chat" && (
              <div className="p-4 space-y-4">
                {msgs.map((msg, i) => {
                  if (msg.isWelcome) return null;
                  const isUser = msg.role === "user";
                  return (
                    <div key={i} className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
                      {!isUser && (
                        <div className={cn(
                          "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          msg.isError
                            ? "bg-red-100 dark:bg-red-950"
                            : "bg-gradient-to-br from-blue-600 to-teal-500"
                        )}>
                          {msg.isError
                            ? <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            : <BarChart2 className="h-3.5 w-3.5 text-white" />
                          }
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[88%] rounded-2xl px-4 py-3",
                        isUser
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : msg.isError
                            ? "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-tl-sm"
                            : "bg-muted rounded-tl-sm"
                      )}>
                        <MessageContent content={msg.content} />
                      </div>
                      {isUser && (
                        <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && <TypingDots />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Quick reply chips — chat view only */}
          {view === "chat" && !loading && (
            <div className="px-3 py-2 border-t flex gap-1.5 overflow-x-auto shrink-0">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)}
                  className="text-[11px] bg-muted hover:bg-muted/70 border hover:border-border rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="p-3 border-t flex gap-2 shrink-0 bg-background">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !loading && send()}
              placeholder="Ask about your finances..."
              disabled={loading}
              className="flex-1 text-sm bg-muted rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 disabled:opacity-30 flex items-center justify-center shrink-0 hover:shadow-md active:scale-95 transition-all"
            >
              {loading
                ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                : <Send className="h-4 w-4 text-white" />
              }
            </button>
          </div>
        </div>
      )}
    </>
  );
}