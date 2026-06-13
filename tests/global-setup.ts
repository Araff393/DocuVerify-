import { execFileSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

const PLACEHOLDER_RE =
  /(PROJECT_REF|PASSWORD|REGION|TEST_PROJECT_REF|TEST_PASSWORD|TEST_REGION)/;

function requireTestDatabaseUrl(name: "TEST_DATABASE_URL" | "TEST_DIRECT_URL") {
  const value = process.env[name]?.trim();
  if (!value || PLACEHOLDER_RE.test(value)) {
    throw new Error(
      `${name} belum dikonfigurasi. Gunakan Supabase project khusus test, bukan production.`
    );
  }
  if (!value.startsWith("postgresql://")) {
    throw new Error(`${name} harus berupa PostgreSQL connection string.`);
  }
  return value;
}

/**
 * Vitest global setup.
 *
 * Test API melakukan delete/reset data. Karena production sekarang memakai
 * Supabase, setup ini sengaja hard-fail kalau test DB belum dipisahkan.
 */
export default async function globalSetup() {
  loadEnv({ path: ".env.local", override: false });
  loadEnv({ path: ".env.test", override: true });

  const productionUrl = process.env.DATABASE_URL?.trim();
  const testDatabaseUrl = requireTestDatabaseUrl("TEST_DATABASE_URL");
  const testDirectUrl = requireTestDatabaseUrl("TEST_DIRECT_URL");

  if (productionUrl && productionUrl === testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL tidak boleh sama dengan DATABASE_URL production."
    );
  }

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DIRECT_URL = testDirectUrl;

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(npx, ["prisma", "db", "push", "--skip-generate"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    await prisma.verificationLog.deleteMany();
    await prisma.adminAuditLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.admin.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
}
