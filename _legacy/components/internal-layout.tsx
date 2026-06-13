import Link from "next/link";

import { Sidebar } from "@/components/sidebar";

type InternalLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function InternalLayout({ title, subtitle, children }: InternalLayoutProps) {
  return (
    <>
      {/* Top Nav Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0d1321] shadow-[0_0_15px_rgba(0,240,255,0.06)] h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#00f0ff] font-headline">
            The Professional Ledger
          </Link>

        </div>
        <div className="flex items-center gap-4">

          <button className="px-6 py-2 primary-gradient text-on-primary-fixed font-bold rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all text-sm">
            Connect Node
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="pt-28 md:ml-72 px-6 md:px-12 pb-20 min-h-screen">
        <header className="mb-12">
          <h1 className="text-5xl font-headline font-bold text-primary tracking-tight mb-2">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-on-surface-variant font-body max-w-2xl leading-relaxed">{subtitle}</p>
          ) : null}
        </header>
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#1a2332] flex items-center justify-around h-16 z-50 px-4 border-t border-outline-variant/20">
        <Link href="/register" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined">app_registration</span>
          <span className="text-[10px] uppercase font-bold mt-1">Reg</span>
        </Link>
        <Link href="/verify" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined">verified_user</span>
          <span className="text-[10px] uppercase font-bold mt-1">Verify</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined">history_edu</span>
          <span className="text-[10px] uppercase font-bold mt-1">History</span>
        </Link>
      </nav>
    </>
  );
}
