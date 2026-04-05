import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { FinanceChatbot } from "@/components/finance-chatbot";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinLytics — Finance · Data · Analytics",
  description: "AI-powered personal finance analytics. Import bank statements, auto-categorise transactions, detect subscriptions, track insurance and get Gemini AI insights.",
};

// Your GA4 Measurement ID from .env.local → NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* FinLytics SVG favicon */}
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'><rect width='36' height='36' rx='9' fill='%230C1F3F'/><rect x='5' y='22' width='5' height='9' rx='1.5' fill='%23378ADD'/><rect x='13' y='16' width='5' height='15' rx='1.5' fill='%2385B7EB'/><rect x='21' y='10' width='5' height='21' rx='1.5' fill='%23378ADD'/><polyline points='7.5,21 15.5,14 23.5,8 31,5' fill='none' stroke='%231D9E75' stroke-width='1.8' stroke-linecap='round'/><circle cx='31' cy='5' r='2.5' fill='%235DCAA5'/></svg>"
          />

          {/*
            Google Analytics 4
            ─────────────────
            Script 1: Loads the GA4 library from Google CDN (non-blocking, after page is interactive)
            Script 2: Initialises GA4 with your Measurement ID and starts auto-tracking page views

            What happens automatically with zero extra code:
            - Every page navigation is recorded as a page_view event
            - User country, browser, device type are captured
            - Session duration and bounce rate are calculated

            Custom events (import, chatbot, goals etc.) are fired separately
            via the functions in lib/analytics-events.js

            Only loads in production when NEXT_PUBLIC_GA_ID env var is set.
            Safe to deploy without it — no errors if the variable is missing.
          */}
          {GA_ID && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                strategy="afterInteractive"
              />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    send_page_view: true,
                    cookie_flags: 'SameSite=None;Secure',
                  });
                `}
              </Script>
            </>
          )}
        </head>

        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
            <FinanceChatbot />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}