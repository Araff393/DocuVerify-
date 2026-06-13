import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { AppError, toAppError } from "@/lib/errors";
import { maskOwnerIdentity, maskPersonName } from "@/lib/query";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { computeSHA256FromBuffer, readValidatedPdfBuffer } from "@/lib/upload";

export const runtime = "nodejs";

/**
 * POST /api/verify — verifikasi publik (tanpa auth).
 *
 * Body: FormData { file: PDF }
 *
 * Alur:
 *  1. Hitung SHA-256 hash dari file yang diunggah
 *  2. Cari di Document.hashSHA256
 *  3. Jika ditemukan & status ACTIVE → VALID
 *     Jika ditemukan & status REVOKED → INVALID
 *     Jika tidak ditemukan → NOT_REGISTERED
 *  4. Simpan VerificationLog
 *  5. Return hasil + metadata dokumen (jika VALID)
 *
 * File yang diverifikasi TIDAK disimpan ke disk — hanya untuk hitung hash.
 */
export async function POST(request: Request) {
  try {
    assertRateLimit({
      key: `verify:${getClientIp(request)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
      message:
        "Terlalu banyak percobaan verifikasi. Silakan coba lagi dalam 10 menit.",
    });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("validation", "File PDF wajib diunggah.", 400);
    }
    const pdfBuffer = await readValidatedPdfBuffer(file);

    // Hitung hash SHA-256
    const uploadedHash = computeSHA256FromBuffer(pdfBuffer);

    // Cari dokumen yang cocok
    const matchedDoc = await prisma.document.findUnique({
      where: { hashSHA256: uploadedHash },
    });

    // Tentukan status
    let status: "VALID" | "NOT_REGISTERED" | "INVALID";
    let message: string;

    if (!matchedDoc) {
      status = "NOT_REGISTERED";
      message =
        "Dokumen tidak terdaftar dalam sistem. File ini belum pernah didaftarkan oleh admin.";
    } else if (matchedDoc.status === "REVOKED") {
      status = "INVALID";
      message =
        "Dokumen ditemukan di sistem, tetapi statusnya telah dicabut. Dokumen ini tidak berlaku.";
    } else {
      status = "VALID";
      message =
        "Dokumen terverifikasi — keaslian terjamin. Hash yang diunggah cocok dengan data yang tercatat.";
    }

    // Ambil IP address untuk log (opsional)
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    // Simpan riwayat verifikasi
    await prisma.verificationLog.create({
      data: {
        uploadedHash,
        status,
        documentId: matchedDoc?.id ?? null,
        ipAddress,
      },
    });

    // Response
    return NextResponse.json({
      status,
      message,
      uploadedHash,
      referenceHash: matchedDoc?.hashSHA256,
      document:
        matchedDoc && status === "VALID"
          ? {
              id: matchedDoc.id,
              title: matchedDoc.title,
              documentType: matchedDoc.documentType,
              ownerName: maskPersonName(matchedDoc.ownerName),
              ownerIdentity: maskOwnerIdentity(matchedDoc.ownerIdentity),
              faculty: matchedDoc.faculty,
              studyProgram: matchedDoc.studyProgram,
              documentYear: matchedDoc.documentYear,
              institution: matchedDoc.institution,
            }
          : undefined,
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
