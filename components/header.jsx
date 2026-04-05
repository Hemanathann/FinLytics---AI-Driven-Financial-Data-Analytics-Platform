import React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { LayoutDashboard, PenBox, BarChart2, LogIn, Upload, Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="9" fill="#0C1F3F"/>
      <rect x="5"  y="22" width="5" height="9"  rx="1.5" fill="#378ADD"/>
      <rect x="13" y="16" width="5" height="15" rx="1.5" fill="#85B7EB"/>
      <rect x="21" y="10" width="5" height="21" rx="1.5" fill="#378ADD"/>
      <polyline points="7.5,21 15.5,14 23.5,8 31,5" fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="31" cy="5" r="2.5" fill="#5DCAA5"/>
      <rect x="27" y="24" width="8" height="8" rx="2" fill="#185FA5"/>
      <text x="31" y="30.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="#B5D4F4" fontFamily="monospace">fx</text>
    </svg>
  );
}

const Header = async () => {
  await checkUser();
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <nav className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="text-[19px] font-black tracking-tight leading-none select-none">
              <span className="text-blue-600 dark:text-blue-400">Fin</span>
              <span className="text-slate-900 dark:text-white">Lytics</span>
            </span>
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <SignedOut>
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1">
                {[["#features","Features"],["#how-it-works","How it works"]].map(([href,label])=>(
                  <a key={href} href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 px-4 py-1.5 rounded-xl transition-all font-medium">{label}</a>
                ))}
              </div>
            </SignedOut>
            <SignedIn>
              <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1">
                {[["/dashboard","Dashboard"],["/analytics","Analytics"],["/statement-import","Import"],["/transaction/create","Add entry"]].map(([href,label])=>(
                  <Link key={href} href={href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 px-4 py-1.5 rounded-xl transition-all font-medium">{label}</Link>
                ))}
              </div>
            </SignedIn>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard">
                <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <LogIn className="h-4 w-4"/>Sign in
                </button>
              </SignInButton>
              <SignInButton forceRedirectUrl="/dashboard">
                <button className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20">Get started</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <ThemeToggle />
              <Link href="/transaction/create" className="md:hidden">
                <button className="flex items-center gap-1 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-xl transition-all">
                  <PenBox className="h-4 w-4"/>
                </button>
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }}/>
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Mobile bottom nav bar */}
      <SignedIn>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-4">
            {[
              ["/dashboard",         "Home",     Home],
              ["/analytics",         "Analytics",BarChart2],
              ["/statement-import",  "Import",   Upload],
              ["/transaction/create","Add",      PenBox],
            ].map(([href, label, Icon]) => (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <Icon className="h-5 w-5"/>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </SignedIn>
    </>
  );
};

export default Header;