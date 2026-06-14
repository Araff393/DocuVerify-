import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { AppError, toAppError } from "@/lib/errors";
import { maskOwnerIdentity, maskPersonName } from "@/lib/query";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { toPublicDocument } from "@/lib/public-document";
import { computeSHA256FromBuffer, readValidatedPdfBuffer } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertRateLimit({
      key: `verify-qr:${getClientIp(request)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
      message:
        "Terlalu banyak percobaan verifikasi QR. Silakan coba lagi dalam 10 menit.",
    });

    const formData = await request.formData();
    const publicCode = formData.get("publicCode")?.toString().trim();
    const file = formData.get("file");

    if (!publicCode) {
      throw new AppError("validation", "Kode publik dokumen wajib dikirim.", 400);
    }
    if (!(file instanceof File)) {
      throw new AppError("validation", "File PDF wajib diunggah.", 400);
    }

    const pdfBuffer = await readValidatedPdfBuffer(file);
    const uploadedHash = computeSHA256FromBuffer(pdfBuffer);

    const document = await prisma.document.findUnique({
      where: { publicCode },
    });

    if (!document) {
      await prisma.verificationLog.create({
        data: {
          uploadedHash,
          status: "NOT_REGISTERED",
          documentId: null,
          ipAddress: getClientIp(request),
        },
      });

      return NextResponse.json({
        status: "NOT_REGISTERED",
        message:
          "Kode QR tidak dikenali oleh sistem DocuVerify. Pastikan QR berasal dari dokumen resmi.",
        uploadedHash,
        registeredHash: null,
        matched: false,
        document: null,
      });
    }

    const isRevoked = document.status === "REVOKED";
    const matched = uploadedHash === document.hashSHA256;
    const status = isRevoked ? "REVOKED" : matched ? "VALID" : "INVALID";
    const message = isRevoked
      ? "Dokumen ditemukan, tetapi statusnya telah dicabut. Dokumen ini tidak berlaku."
      : matched
      ? "Dokumen valid. File yang diunggah cocok dengan hash resmi yang tercatat."
      : "Dokumen tidak valid. File yang diunggah tidak cocok dengan hash resmi dokumen ini.";

    await prisma.verificationLog.create({
      data: {
        uploadedHash,
        status: status === "VALID" ? "VALID" : "INVALID",
        documentId: document.id,
        ipAddress: getClientIp(request),
      },
    });

    return NextResponse.json({
      status,
      message,
      uploadedHash,
      registeredHash: document.hashSHA256,
      matched,
      document: {
        ...toPublicDocument(document),
        ownerName: maskPersonName(document.ownerName),
        ownerIdentity: maskOwnerIdentity(document.ownerIdentity),
      },
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
