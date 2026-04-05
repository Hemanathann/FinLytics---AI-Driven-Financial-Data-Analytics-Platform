// ── FinLytics currency formatter — EUR throughout ────────────
// All amounts are stored and displayed in EUR.
// Uses Irish locale (en-IE) for correct formatting: €1,234.56

export function fmt(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(num);
}

// Compact format for chart axes: €30,336 → €30.3k
export function fmtCompact(amount) {
  const num = Number(amount || 0);
  if (Math.abs(num) >= 1_000_000) return `€${(num/1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000)     return `€${(num/1_000).toFixed(1)}k`;
  return `€${num.toFixed(0)}`;
}