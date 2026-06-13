/**
 * Pinata IPFS Helper — Server-side only
 *
 * Menggunakan Pinata SDK resmi untuk upload dan retrieve file IPFS.
 * File ini HANYA boleh digunakan di server-side code (API routes, Server Actions, dll).
 *
 * Pinata bersifat OPSIONAL di sistem ini — jika PINATA_JWT belum dikonfigurasi,
 * fungsi `tryUploadPdf` / `tryDeleteFile` akan return null tanpa error.
 * Gunakan fungsi `try*` untuk safe operations dan `*` (tanpa prefix) untuk
 * strict operations yang throw kalau Pinata tidak tersedia.
 */
import "server-only";

import { PinataSDK } from "pinata";

import { getServerEnv, isPinataConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";

// ============================================================
// Singleton Pinata SDK instance
// ============================================================

let pinataInstance: PinataSDK | null = null;

/**
 * Mendapatkan instance PinataSDK yang sudah dikonfigurasi.
 * Return null jika PINATA_JWT belum di-set.
 */
function getPinataClientOrNull(): PinataSDK | null {
  if (!isPinataConfigured()) return null;

  if (!pinataInstance) {
    const { pinataJwt, pinataGateway } = getServerEnv();
    pinataInstance = new PinataSDK({
      pinataJwt,
      pinataGateway,
    });
  }
  return pinataInstance;
}

/**
 * Strict version — throw AppError kalau Pinata belum dikonfigurasi.
 */
function getPinataClient(): PinataSDK {
  const client = getPinataClientOrNull();
  if (!client) {
    throw new AppError(
      "ipfs",
      "Pinata IPFS belum dikonfigurasi. Set PINATA_JWT di .env.local.",
      503
    );
  }
  return client;
}

// ============================================================
// Upload Functions
// ============================================================

export type PinataUploadResult = {
  cid: string;
  id: string;
  name: string;
};

/**
 * Strict upload — throw AppError kalau Pinata belum siap atau upload gagal.
 */
export async function uploadPdfToPinata(
  file: File,
  label: string
): Promise<PinataUploadResult> {
  const pinata = getPinataClient();

  try {
    const result = await pinata.upload.public.file(file).name(label);

    if (!result.cid) {
      throw new AppError("ipfs", "Pinata tidak mengembalikan CID.", 502);
    }

    return {
      cid: result.cid,
      id: result.id,
      name: result.name ?? label,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError("ipfs", "Gagal mengunggah PDF ke Pinata.", 500, message);
  }
}

/**
 * Safe upload — return null kalau Pinata belum dikonfigurasi atau upload gagal.
 * Cocok dipakai di flow utama (POST /api/documents) supaya kegagalan IPFS
 * tidak menggagalkan registrasi dokumen secara keseluruhan.
 */
export async function tryUploadPdfToPinata(
  file: File,
  label: string
): Promise<PinataUploadResult | null> {
  if (!isPinataConfigured()) return null;

  try {
    return await uploadPdfToPinata(file, label);
  } catch (error) {
    // Log tapi jangan propagasi — Pinata adalah bonus layer
    console.warn(
      "[pinata] Upload gagal, dokumen tetap didaftarkan tanpa CID:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

// ============================================================
// Retrieve Functions
// ============================================================

/**
 * Ambil URL gateway publik untuk file berdasarkan CID.
 * Kembalikan URL lengkap, cocok dipakai untuk redirect / <a href>.
 */
export async function getFileUrl(cid: string): Promise<string> {
  const pinata = getPinataClient();

  try {
    const url = await pinata.gateways.public.convert(cid);
    return url;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(
      "ipfs",
      "Gagal mendapatkan URL file dari gateway.",
      500,
      message
    );
  }
}

/**
 * Safe version — return null kalau gagal/belum dikonfigurasi.
 */
export async function tryGetFileUrl(cid: string): Promise<string | null> {
  if (!isPinataConfigured()) return null;
  try {
    return await getFileUrl(cid);
  } catch {
    return null;
  }
}

/**
 * Direct fetch via Pinata gateway untuk streaming file PDF.
 * Dipakai sebagai fallback ketika file lokal tidak ada.
 */
export async function fetchPdfFromPinata(cid: string): Promise<ArrayBuffer> {
  const { pinataGateway } = getServerEnv();
  const gatewayBase = pinataGateway.endsWith("/ipfs")
    ? pinataGateway
    : `${pinataGateway.replace(/\/+$/, "")}/ipfs`;
  const url = `${gatewayBase}/${cid}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new AppError(
      "ipfs",
      `Gagal mengambil file dari IPFS gateway (${res.status}).`,
      502
    );
  }
  return await res.arrayBuffer();
}

// ============================================================
// File Management Functions
// ============================================================

/**
 * Menghapus (unpin) file dari Pinata berdasarkan ID file.
 * Catatan: unpin tidak langsung menghapus dari jaringan IPFS,
 * hanya melepas komitmen pinning dari akun Pinata kita.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const pinata = getPinataClient();

  try {
    await pinata.files.public.delete([fileId]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(
      "ipfs",
      "Gagal menghapus file dari Pinata.",
      500,
      message
    );
  }
}

/**
 * Safe version — tidak throw, return false kalau gagal/belum dikonfigurasi.
 */
export async function tryDeleteFile(fileId: string): Promise<boolean> {
  if (!isPinataConfigured()) return false;
  try {
    await deleteFile(fileId);
    return true;
  } catch (error) {
    console.warn(
      "[pinata] Unpin gagal:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * List file yang tersimpan di Pinata (untuk debugging / admin tooling).
 */
export async function listFiles(limit = 10) {
  const pinata = getPinataClient();

  try {
    const files = await pinata.files.public.list().limit(limit);
    return files;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(
      "ipfs",
      "Gagal mengambil daftar file dari Pinata.",
      500,
      message
    );
  }
}
