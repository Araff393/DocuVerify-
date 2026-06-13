"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/register", label: "Register", icon: "app_registration" },
  { href: "/verify", label: "Verify", icon: "verified_user" },
  { href: "/history", label: "History", icon: "history_edu" }
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: string }>;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-72 fixed left-0 top-0 flex-col py-8 px-4 border-r border-[#1a2332] bg-[#0d1321] z-40 mt-20">
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary-container">
              admin_panel_settings
            </span>
          </div>
          <div>
            <h3 className="font-headline text-[#00f0ff] font-bold text-sm flex items-center gap-1">
              Admin Node
              <span
                className="material-symbols-outlined text-[14px] text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">
              Verified Archive Access
            </p>
          </div>
        </div>
        <Link
          href="/register"
          className="block w-full py-3 text-center bg-primary-container/10 border border-primary-container/30 text-primary-container font-headline font-bold text-xs uppercase tracking-widest hover:bg-primary-container/20 active:opacity-80 transition-all"
        >
          New Entry
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm uppercase tracking-widest transition-all ${
                isActive
                  ? "bg-[#1a2332] text-[#00f0ff] border-l-4 border-[#00f0ff]"
                  : "text-slate-500 hover:text-white hover:bg-[#1a2332]/50"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="font-headline">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-[#1a2332] space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-[#1a2332]/50 transition-all duration-200 text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="font-headline">Settings</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white hover:bg-[#1a2332]/50 transition-all duration-200 text-sm uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-headline">Logout</span>
        </a>
      </div>
    </aside>
  );
}
