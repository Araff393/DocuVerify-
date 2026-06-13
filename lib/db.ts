import "server-only";

import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma Client.
 *
 * Next.js dalam mode development me-reload modul setiap perubahan,
 * yang bisa menyebabkan banyak instance PrismaClient terbuat (dan
 * memicu warning koneksi). Pola standar: simpan instance di globalThis
 * supaya reuse antar hot-reload. Di production, buat instance baru sekali.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
