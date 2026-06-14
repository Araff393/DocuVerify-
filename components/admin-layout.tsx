import Link from "next/link";

import { AdminSidebar } from "@/components/admin-sidebar";

type AdminLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function AdminLayout({ title, subtitle, children, actions }: AdminLayoutProps) {
  return (
    <>
      {/* Top Nav Bar */}
      <header className="fixed top-0 w-full z-50 bg-[#0d1321] shadow-[0_0_15px_rgba(0,240,255,0.06)] h-20 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b border-[#1a2332]">
        <div className="flex min-w-0 items-center gap-4 md:gap-8">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8ff5ff]/10 border border-[#8ff5ff]/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#8ff5ff] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <span className="truncate text-base sm:text-lg font-bold tracking-tighter font-headline text-white">
              DocuVerify <span className="text-[#8ff5ff]">UNY</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center px-3 py-1 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 rounded-full text-[10px] text-[#8ff5ff] uppercase tracking-widest font-bold">
            Admin Panel
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-sm">public</span>
            Halaman Publik
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="pt-28 md:ml-72 px-4 sm:px-6 md:px-12 pb-28 md:pb-20 min-h-screen overflow-x-hidden">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-white tracking-tight mb-2 break-words">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed break-words">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">{actions}</div>}
        </header>
        {children}
      </main>

      {/* Bottom Nav (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0d1321] flex items-center justify-around h-16 z-50 px-4 border-t border-[#1a2332]">
        <Link href="/admin/dashboard" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-[9px] uppercase font-bold mt-1">Dashboard</span>
        </Link>
        <Link href="/admin/documents" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined text-[20px]">folder_open</span>
          <span className="text-[9px] uppercase font-bold mt-1">Dokumen</span>
        </Link>
        <Link href="/admin/documents/create" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined text-[20px]">note_add</span>
          <span className="text-[9px] uppercase font-bold mt-1">Baru</span>
        </Link>
        <Link href="/admin/verifications" className="flex flex-col items-center text-slate-400 active:opacity-80">
          <span className="material-symbols-outlined text-[20px]">history</span>
          <span className="text-[9px] uppercase font-bold mt-1">Riwayat</span>
        </Link>
      </nav>
    </>
  );
}
