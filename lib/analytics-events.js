/**
 * FinLytics Analytics — GA4 custom event tracking
 *
 * HOW IT WORKS:
 * - window.gtag() is injected by the GA4 script in layout.js
 * - Each function below fires one meaningful event with useful properties
 * - All events appear in GA4 → Reports → Events within 24 hours
 * - Realtime data appears in GA4 → Realtime instantly
 *
 * WHAT EACH EVENT TELLS YOU:
 * - statement_imported    → Are users actually using the import feature?
 * - chatbot_message_sent  → Is the AI advisor being used?
 * - analytics_tab_viewed  → Which charts do users care about most?
 * - goal_created          → Do users engage with goal tracking?
 * - csv_exported          → Are users taking data out?
 * - budget_set            → Do users configure budgets?
 * - account_created       → New account setup rate
 * - page_feature_used     → Generic feature engagement tracker
 */

// Safe gtag caller — does nothing if GA4 script hasn't loaded
// (e.g. in development without a real GA_ID)
function gtag(...args) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

// ── Statement import ─────────────────────────────────────────
// Fired when: user completes CSV import successfully
// GA4 shows: how many imports happen per day, avg transactions per import
export function trackStatementImported({ count, skipped, lowConfidence }) {
  gtag("event", "statement_imported", {
    event_category:    "import",
    transactions_count: count,
    duplicates_skipped: skipped || 0,
    low_confidence:     lowConfidence || 0,
  });
}

// ── Chatbot usage ────────────────────────────────────────────
// Fired when: user sends any message to the AI advisor
// GA4 shows: total chatbot messages per day, most popular question category
export function trackChatbotMessage({ category = "custom" }) {
  gtag("event", "chatbot_message_sent", {
    event_category:   "ai",
    question_category: category,
  });
}

// Fired when: chatbot window is opened
// GA4 shows: how many users discover vs actually use the chatbot
export function trackChatbotOpened() {
  gtag("event", "chatbot_opened", {
    event_category: "ai",
  });
}

// ── Analytics page ───────────────────────────────────────────
// Fired when: user clicks any tab on the analytics page
// GA4 shows: which tabs are most visited — tells you which charts matter
export function trackAnalyticsTabViewed(tabName) {
  gtag("event", "analytics_tab_viewed", {
    event_category: "analytics",
    tab_name:       tabName,
  });
}

// Fired when: AI insights tab is opened (separate from tab click —
// shows intentional engagement with the AI output)
export function trackAIInsightsViewed() {
  gtag("event", "ai_insights_viewed", {
    event_category: "ai",
  });
}

// ── Goals ────────────────────────────────────────────────────
// Fired when: user creates a savings goal
// GA4 shows: goal creation rate, popular target amounts
export function trackGoalCreated({ targetAmount, emoji }) {
  gtag("event", "goal_created", {
    event_category: "goals",
    target_amount:  Math.round(targetAmount || 0),
    emoji:          emoji || "🎯",
  });
}

// ── Export ───────────────────────────────────────────────────
// Fired when: user downloads CSV export
// GA4 shows: export usage — if high, users want their data elsewhere
export function trackCSVExported() {
  gtag("event", "csv_exported", {
    event_category: "export",
  });
}

// ── Budget ───────────────────────────────────────────────────
// Fired when: user sets or updates their monthly budget
// GA4 shows: budget engagement rate
export function trackBudgetSet({ amount }) {
  gtag("event", "budget_set", {
    event_category: "budget",
    amount:         Math.round(amount || 0),
  });
}

// ── Account ──────────────────────────────────────────────────
// Fired when: user creates a new account
// GA4 shows: onboarding completion rate
export function trackAccountCreated({ type, currency }) {
  gtag("event", "account_created", {
    event_category: "onboarding",
    account_type:   type || "CURRENT",
    currency:       currency || "USD",
  });
}

// ── Dashboard tab ────────────────────────────────────────────
// Fired when: user switches dashboard tabs
// GA4 shows: which dashboard sections are most used
export function trackDashboardTabViewed(tabName) {
  gtag("event", "dashboard_tab_viewed", {
    event_category: "navigation",
    tab_name:       tabName,
  });
}

// ── Generic feature tracker ──────────────────────────────────
// Use this for anything not covered above
export function trackFeatureUsed(featureName, extra = {}) {
  gtag("event", "feature_used", {
    event_category: "engagement",
    feature_name:   featureName,
    ...extra,
  });
}