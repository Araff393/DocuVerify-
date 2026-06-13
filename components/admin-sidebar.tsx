"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCsrfToken } from "@/lib/client-csrf";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/documents", label: "Daftar Dokumen", icon: "folder_open" },
  { href: "/admin/documents/create", label: "Pendaftaran Baru", icon: "note_add" },
  { href: "/admin/verifications", label: "Riwayat Verifikasi", icon: "history" },
  { href: "/admin/audit-logs", label: "Audit Log", icon: "fact_check" },
  { href: "/admin/account", label: "Akun", icon: "manage_accounts" },
] as const satisfies ReadonlyArray<{ href: string; label: string; icon: string }>;

type AdminProfile = {
  name: string;
  email: string;
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.admin) {
          setAdmin({ name: data.admin.name, email: data.admin.email });
        }
      } catch {
        // Profil admin hanya dekoratif di sidebar; flow utama tetap jalan.
      }
    }

    void loadAdmin();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    setLogoutError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        setLogoutError(data?.error?.message ?? "Gagal logout. Coba lagi.");
        setLogoutLoading(false);
        return;
      }

      window.location.href = "/admin/login";
    } catch {
      setLogoutError("Gagal terhubung ke server. Coba lagi.");
      setLogoutLoading(false);
    }
  }

  return (
    <aside className="hidden md:flex h-screen w-72 fixed left-0 top-0 flex-col py-8 px-4 border-r border-[#1a2332] bg-[#0d1321] z-40 mt-20">
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#8ff5ff]/10 flex items-center justify-center border border-[#8ff5ff]/20">
            <span
              className="material-symbols-outlined text-[#8ff5ff]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <h3 className="font-headline text-[#8ff5ff] font-bold text-sm flex items-center gap-1">
              Admin Panel
              <span
                className="material-symbols-outlined text-[14px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              DocuVerify UNY
            </p>
          </div>
        </div>
        <Link
          href="/admin/documents/create"
          className="block w-full py-3 text-center bg-[#8ff5ff]/10 border border-[#8ff5ff]/30 text-[#8ff5ff] font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#8ff5ff]/20 active:opacity-80 transition-all"
        >
          + Dokumen Baru
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href === "/admin/documents" &&
              pathname.startsWith("/admin/documents") &&
              pathname !== "/admin/documents/create");
          return (
            <Link
              key={link.href}
              href={link.href as Route}
              className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest transition-all ${
                isActive
                  ? "bg-[#1a2332] text-[#8ff5ff] border-l-4 border-[#8ff5ff]"
                  : "text-slate-500 hover:text-white hover:bg-[#1a2332]/50"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="font-headline text-xs">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-[#1a2332] space-y-1">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#8ff5ff]/10 flex items-center justify-center text-xs text-[#8ff5ff] font-bold">
            {admin?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div>
            <p className="text-xs text-white font-medium">
              {admin?.name ?? "Administrator"}
            </p>
            <p className="text-[10px] text-slate-500">
              {admin?.email ?? "Admin aktif"}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-[#1a2332]/50 transition-all duration-200 text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[20px]">home</span>
          <span className="font-headline text-xs">Ke Beranda</span>
        </Link>
        {logoutError && (
          <p className="px-4 text-[10px] leading-relaxed text-error">
            {logoutError}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-error hover:bg-error/5 transition-all duration-200 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-headline text-xs">
            {logoutLoading ? "Logout..." : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
}
