"use client";

import { FormEvent, useState } from "react";

import { AdminLayout } from "@/components/admin-layout";
import { getCsrfToken } from "@/lib/client-csrf";

type AccountState = {
  loading: boolean;
  error?: string;
  success?: string;
};

export default function AdminAccountPage() {
  const [state, setState] = useState<AccountState>({ loading: false });
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ loading: true });

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setState({
          loading: false,
          error: data?.error?.message ?? "Gagal mengubah password.",
        });
        return;
      }

      form.reset();
      setState({
        loading: false,
        success: "Password admin berhasil diperbarui.",
      });
    } catch {
      setState({
        loading: false,
        error: "Gagal terhubung ke server. Silakan coba lagi.",
      });
    }
  }

  return (
    <AdminLayout
      title="Akun Admin"
      subtitle="Kelola keamanan akun administrator yang sedang aktif."
    >
      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-8 space-y-6"
        >
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="form-label">
              Password Lama
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type={showPassword ? "text" : "password"}
              required
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="form-label">
              Password Baru
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="form-label">
              Konfirmasi Password Baru
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              className="form-input"
              autoComplete="new-password"
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 accent-[#8ff5ff]"
            />
            Tampilkan password
          </label>

          {state.error && (
            <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error">{state.error}</p>
            </div>
          )}
          {state.success && (
            <div className="px-4 py-3 bg-secondary/10 border border-secondary/20 rounded-lg">
              <p className="text-sm text-secondary">{state.success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={state.loading}
            className="bg-[#8ff5ff] text-[#080e1c] px-8 py-4 font-headline font-bold text-sm tracking-tight hover:bg-[#b3faff] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">lock_reset</span>
            {state.loading ? "Menyimpan..." : "Ubah Password"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
