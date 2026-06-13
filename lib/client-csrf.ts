"use client";

let cachedCsrfToken: string | null = null;

export async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const res = await fetch("/api/auth/csrf", {
    method: "GET",
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || typeof data?.csrfToken !== "string") {
    throw new Error(
      data?.error?.message ?? "Gagal menyiapkan token keamanan."
    );
  }

  cachedCsrfToken = data.csrfToken;
  return data.csrfToken;
}
