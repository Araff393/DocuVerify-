"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getSafeAdminRedirect } from "@/lib/redirect";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const redirect = useMemo(
    () => getSafeAdminRedirect(searchParams.get("redirect")),
    [searchParams]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error?.message ??
            "Email atau password salah. Silakan coba lagi."
        );
        setLoading(false);
        return;
      }

      // Hard navigate — supaya middleware membaca cookie baru
      window.location.href = redirect;
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080e1c] flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#8ff5ff]/[0.04] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-[#8ff5ff]/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-11 h-11 rounded-xl bg-[#8ff5ff]/10 border border-[#8ff5ff]/30 flex items-center justify-center group-hover:bg-[#8ff5ff]/15 group-hover:border-[#8ff5ff]/50 transition-all duration-300">
              <span className="material-symbols-outlined text-[#8ff5ff] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase font-headline">
              DocuVerify <span className="text-[#8ff5ff]">UNY</span>
            </span>
          </Link>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight mb-3">
            Login Administrator
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[300px] mx-auto">
            Masuk untuk mengelola dokumen akademik Universitas Negeri Yogyakarta
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#8ff5ff]/10 bg-[#0d1321]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(143,245,255,0.04)] overflow-hidden">
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#8ff5ff]/40 to-transparent" />

          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 text-lg group-focus-within:text-[#8ff5ff] transition-colors">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-[#080e1c] border border-[#424858]/30 rounded-xl pl-12 pr-4 py-4 text-white text-sm outline-none transition-all duration-200 focus:border-[#8ff5ff]/40 focus:ring-2 focus:ring-[#8ff5ff]/10 placeholder:text-slate-600"
                  placeholder="admin@uny.ac.id"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-500 text-lg group-focus-within:text-[#8ff5ff] transition-colors">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-[#080e1c] border border-[#424858]/30 rounded-xl pl-12 pr-12 py-4 text-white text-sm outline-none transition-all duration-200 focus:border-[#8ff5ff]/40 focus:ring-2 focus:ring-[#8ff5ff]/10 placeholder:text-slate-600"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-slate-500 hover:text-[#8ff5ff] transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/20 rounded-xl animate-fade-in-up">
                <span className="material-symbols-outlined text-error text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8ff5ff] to-[#6be8f7] text-[#080e1c] py-4 rounded-xl font-headline font-bold text-sm tracking-wide hover:from-[#b3faff] hover:to-[#8ff5ff] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(143,245,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Masuk ke Dashboard
                </>
              )}
            </button>

            {/* Back Link */}
            <div className="text-center pt-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-[#8ff5ff] transition-colors uppercase tracking-widest group"
              >
                <span className="material-symbols-outlined text-sm group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                Kembali ke Beranda
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} DocuVerify UNY • Universitas Negeri Yogyakarta
        </p>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="min-h-screen bg-[#080e1c] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#8ff5ff]/10 bg-[#0d1321]/80 p-8 text-center">
        <p className="text-sm font-semibold text-[#8ff5ff]">Memuat halaman login...</p>
      </div>
    </div>
  );
}
