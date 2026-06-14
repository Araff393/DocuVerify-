import "server-only";

import { createHash } from "node:crypto";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { AppError } from "@/lib/errors";
import { FILE_MAX_BYTES, FILE_MAX_MB } from "@/lib/constants";

/**
 * Folder penyimpanan file PDF di server.
 * Local development memakai root project. Vercel serverless hanya writable di
 * /tmp, jadi runtime production memakai /tmp/uploads.
 */
const UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");
const PDF_MAGIC_BYTES = Buffer.from("%PDF-");

/**
 * Validasi file PDF (tipe + ukuran).
 */
export function assertPdfFile(file: File | null | undefined): asserts file is File {
  if (!file) {
    throw new AppError("validation", "File PDF wajib diunggah.", 400);
  }

  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    throw new AppError("validation", "File harus berformat PDF.", 400);
  }

  if (file.size > FILE_MAX_BYTES) {
    const actualMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new AppError(
      "validation",
      `Ukuran file maksimal ${FILE_MAX_MB} MB. File Anda: ${actualMB} MB.`,
      400
    );
  }
}

/**
 * Hitung SHA-256 hash dari Buffer (server-side).
 */
export function computeSHA256FromBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function readValidatedPdfBuffer(file: File): Promise<Buffer> {
  assertPdfFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.subarray(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES)) {
    throw new AppError(
      "validation",
      "File harus berformat PDF yang valid.",
      400
    );
  }

  return buffer;
}

/**
 * Hitung SHA-256 hash dari File (server-side).
 */
export async function computeSHA256FromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return computeSHA256FromBuffer(buffer);
}

/**
 * Sanitize nama file — remove path separators dan karakter berbahaya.
 */
function sanitizeFileName(name: string): string {
  // Ambil basename saja (buang path)
  const base = path.basename(name);
  // Ganti karakter non-alphanumeric kecuali ._- dengan _
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

/**
 * Simpan file ke folder uploads/ dengan nama unik.
 * Format: `{timestamp}-{hash8}-{originalName}`
 *
 * @returns metadata file yang tersimpan
 */
export async function saveUploadedFile(
  file: File,
  hashSHA256: string,
  existingBuffer?: Buffer
): Promise<{ fileName: string; filePath: string; storedName: string }> {
  // Pastikan folder uploads/ ada
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const timestamp = Date.now();
  const hashPrefix = hashSHA256.slice(0, 8);
  const safeName = sanitizeFileName(file.name);
  const storedName = `${timestamp}-${hashPrefix}-${safeName}`;

  const fullPath = path.join(UPLOAD_DIR, storedName);
  const buffer =
    existingBuffer ?? Buffer.from(await file.arrayBuffer());

  await writeFile(fullPath, buffer);

  return {
    fileName: file.name, // nama asli (untuk display)
    filePath: `uploads/${storedName}`, // relative path (disimpan di DB)
    storedName, // nama file di disk
  };
}

/**
 * Resolve path absolut file berdasarkan filePath relative dari DB.
 */
export function resolveUploadPath(relativePath: string): string {
  // Jangan trust relativePath dari DB — pastikan tidak ada ../ escape
  const normalized = path.normalize(relativePath).replace(/^[/\\]+/, "");
  if (normalized.startsWith("..") || normalized.includes("..")) {
    throw new AppError("validation", "Invalid file path.", 400);
  }
  if (normalized === "uploads") {
    return UPLOAD_DIR;
  }
  if (normalized.startsWith(`uploads${path.sep}`)) {
    return path.join(UPLOAD_DIR, normalized.slice("uploads".length + 1));
  }
  return path.join(process.cwd(), normalized);
}

/**
 * Hapus file dari disk (cleanup jika DB insert gagal).
 */
export async function deleteUploadedFile(relativePath: string): Promise<void> {
  try {
    const fullPath = resolveUploadPath(relativePath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  } catch {
    // Best-effort — jangan throw di cleanup
  }
}
