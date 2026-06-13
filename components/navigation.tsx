"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <header className="bg-[#080e1c]/80 backdrop-blur-xl fixed w-full top-0 z-50 border-b border-[#424858]/15 shadow-[0_0_30px_rgba(0,240,255,0.05)]">
      <nav className="flex justify-between items-center w-full px-6 md:px-8 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#8ff5ff]/10 border border-[#8ff5ff]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#8ff5ff] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
          </div>
          <span className="text-lg font-black tracking-tight text-white uppercase font-headline">
            DocuVerify <span className="text-[#8ff5ff]">UNY</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center space-x-8 font-headline tracking-tight text-sm">
          <Link
            href="/"
            className={`pb-1 transition-all duration-300 ${
              isActive("/")
                ? "text-[#8ff5ff] border-b-2 border-[#8ff5ff]"
                : "text-[#e3e7fc]/60 hover:text-[#8ff5ff] hover:bg-[#8ff5ff]/5"
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/verify"
            className={`pb-1 transition-all duration-300 ${
              isActive("/verify")
                ? "text-[#8ff5ff] border-b-2 border-[#8ff5ff]"
                : "text-[#e3e7fc]/60 hover:text-[#8ff5ff] hover:bg-[#8ff5ff]/5"
            }`}
          >
            Verifikasi
          </Link>
        </div>

        <div className="hidden lg:flex items-center space-x-4">
          <Link
            href="/admin/login"
            className="bg-[#8ff5ff]/10 text-[#8ff5ff] border border-[#8ff5ff]/30 px-6 py-2 font-black uppercase tracking-widest text-[10px] hover:bg-[#8ff5ff]/20 active:scale-[0.97] transition-all duration-300 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            Login Admin
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            className="text-[#8ff5ff] p-2 hover:bg-[#8ff5ff]/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#424858]/15 bg-[#080e1c]/95 backdrop-blur-xl px-6 py-4 space-y-3">
          <Link href="/" className="block text-[#8ff5ff] text-sm py-2 font-headline uppercase tracking-widest">Beranda</Link>
          <Link href="/verify" className="block text-[#e3e7fc]/60 text-sm py-2 font-headline uppercase tracking-widest hover:text-[#8ff5ff]">Verifikasi</Link>
          <div className="pt-3 border-t border-[#424858]/15">
            <Link
              href="/admin/login"
              className="block bg-[#8ff5ff]/10 text-[#8ff5ff] border border-[#8ff5ff]/30 px-6 py-2 font-black uppercase tracking-widest text-[10px] text-center"
            >
              Login Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
