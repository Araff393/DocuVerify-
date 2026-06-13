import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import {
  createCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/csrf";

/**
 * Helper: buat admin di DB test + login (set cookie session).
 */
export async function createAdminAndLogin(opts?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = opts?.email ?? "test-admin@uny.ac.id";
  const password = opts?.password ?? "testPassword123";
  const name = opts?.name ?? "Test Admin";

  const passwordHash = await hashPassword(password);
  const admin = await prisma.admin.create({
    data: { email, name, passwordHash },
  });

  await createSession({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  });

  return { admin, password };
}

/**
 * Helper: buat admin tanpa login (untuk test login flow).
 */
export async function createAdminOnly(opts?: {
  email?: string;
  password?: string;
  name?: string;
}) {
  const email = opts?.email ?? "test-admin@uny.ac.id";
  const password = opts?.password ?? "testPassword123";
  const name = opts?.name ?? "Test Admin";

  const passwordHash = await hashPassword(password);
  const admin = await prisma.admin.create({
    data: { email, name, passwordHash },
  });

  return { admin, password };
}

/**
 * Helper: buat dokumen seed di DB test.
 */
export async function createSeedDocument(opts: {
  title?: string;
  hashSHA256?: string;
  status?: "ACTIVE" | "REVOKED";
  ownerName?: string;
  faculty?: string;
}) {
  const title = opts.title ?? "Sertifikat Uji Coba";
  const hash =
    opts.hashSHA256 ??
    createHash("sha256")
      .update(title + Math.random())
      .digest("hex");

  return prisma.document.create({
    data: {
      title,
      documentType: "Sertifikat Akademik",
      ownerName: opts.ownerName ?? "Mahasiswa Uji",
      ownerIdentity: "20108999999",
      faculty: opts.faculty ?? "Fakultas Teknik",
      studyProgram: "Pendidikan Teknik Informatika",
      documentYear: 2024,
      fileName: "test.pdf",
      filePath: `uploads/test-${hash.slice(0, 8)}.pdf`,
      hashSHA256: hash,
      status: opts.status ?? "ACTIVE",
    },
  });
}

/**
 * Helper: buat File PDF in-memory dengan konten arbitrary.
 * SHA-256 sudah dihitung untuk match expectation.
 */
export function makePdfFile(
  content = `%PDF-1.4\nTest content ${Math.random()}\n%%EOF`,
  fileName = "test.pdf"
): { file: File; sha256: string } {
  const bytes = new TextEncoder().encode(content);
  const file = new File([bytes], fileName, { type: "application/pdf" });
  const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  return { file, sha256 };
}

/**
 * Helper: build Request dengan FormData (POST API).
 */
export function makeFormDataRequest(
  url: string,
  fields: Record<string, string | File>,
  method = "POST",
  headers?: HeadersInit
): Request {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value as string | Blob);
  }
  return new Request(url, { method, headers, body: formData });
}

/**
 * Helper: build Request JSON.
 */
export function makeJsonRequest(
  url: string,
  body: unknown,
  method = "POST"
): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function createCsrfHeadersForTest(): Record<string, string> {
  const token = createCsrfToken();
  return {
    [CSRF_HEADER_NAME]: token,
    cookie: `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
  };
}
