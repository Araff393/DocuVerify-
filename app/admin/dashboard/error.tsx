"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">
        Gagal memuat Dashboard
      </h2>
      <p className="mb-6 max-w-md text-slate-500 dark:text-slate-400">
        Terjadi masalah saat mengambil data dari database. Silakan coba muat ulang.
        Jika masalah berlanjut, hubungi administrator.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
        Coba Lagi
      </button>
    </div>
  );
}
