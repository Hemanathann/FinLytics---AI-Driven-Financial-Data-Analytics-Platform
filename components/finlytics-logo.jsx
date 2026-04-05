export function FinLyticsLogo({ size = 36, showText = true, textSize = "xl" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {/* ── Icon mark ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded square background */}
        <rect width="36" height="36" rx="9" fill="#0C1F3F" />

        {/* Bar chart — 3 rising columns */}
        <rect x="5"  y="22" width="5" height="9"  rx="1.5" fill="#378ADD" />
        <rect x="13" y="16" width="5" height="15" rx="1.5" fill="#85B7EB" />
        <rect x="21" y="10" width="5" height="21" rx="1.5" fill="#378ADD" />

        {/* Rising trend line over bars */}
        <polyline
          points="7.5,21 15.5,14 23.5,8 31,5"
          fill="none"
          stroke="#1D9E75"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data point dot at tip */}
        <circle cx="31" cy="5" r="2.5" fill="#5DCAA5" />

        {/* Small euro/dollar pulse — bottom right accent */}
        <rect x="27" y="24" width="8" height="8" rx="2" fill="#185FA5" />
        <text
          x="31"
          y="30.5"
          textAnchor="middle"
          fontSize="6"
          fontWeight="700"
          fill="#B5D4F4"
          fontFamily="monospace"
        >
          fx
        </text>
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <span
            style={{
              fontSize: textSize === "xl" ? "20px" : textSize === "lg" ? "18px" : "16px",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "inherit",
            }}
          >
            <span style={{ color: "#185FA5" }}>Fin</span>
            <span>Lytics</span>
          </span>
        </div>
      )}
    </div>
  );
}

/* Standalone SVG string for favicon / metadata use */
export const FinLyticsIconSVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="36" height="36" rx="9" fill="#0C1F3F"/>
  <rect x="5"  y="22" width="5" height="9"  rx="1.5" fill="#378ADD"/>
  <rect x="13" y="16" width="5" height="15" rx="1.5" fill="#85B7EB"/>
  <rect x="21" y="10" width="5" height="21" rx="1.5" fill="#378ADD"/>
  <polyline points="7.5,21 15.5,14 23.5,8 31,5" fill="none" stroke="#1D9E75" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="31" cy="5" r="2.5" fill="#5DCAA5"/>
  <rect x="27" y="24" width="8" height="8" rx="2" fill="#185FA5"/>
  <text x="31" y="30.5" text-anchor="middle" font-size="6" font-weight="700" fill="#B5D4F4" font-family="monospace">fx</text>
</svg>
`;