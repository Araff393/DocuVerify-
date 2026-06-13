import { beforeEach, vi } from "vitest";

// ============================================================
// Mock next/headers untuk cookies() — supaya lib/auth bisa jalan di node
// ============================================================
const cookieStore = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value ? { name, value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  }),
}));

// ============================================================
// Mock server-only — file ini biasanya throw kalau di-import di non-server
// ============================================================
vi.mock("server-only", () => ({}));

// ============================================================
// Bersihkan semua tabel dan cookie store sebelum tiap test
// ============================================================
beforeEach(async () => {
  cookieStore.clear();

  const { clearRateLimitsForTest } = await import("@/lib/rate-limit");
  clearRateLimitsForTest();

  const { prisma } = await import("@/lib/db");
  // Order matters — VerificationLog FK ke Document, AdminAuditLog FK ke Admin
  await prisma.verificationLog.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.admin.deleteMany();
});
