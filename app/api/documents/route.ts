import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { AppError, toAppError } from "@/lib/errors";
import {
  parseDocumentStatus,
  parseDocumentType,
  parseFaculty,
  parsePagination,
} from "@/lib/query";
import {
  computeSHA256FromBuffer,
  deleteUploadedFile,
  readValidatedPdfBuffer,
  saveUploadedFile,
} from "@/lib/upload";
import { validateRegisterDocumentInput } from "@/lib/validation";
import {
  tryDeleteFile,
  tryUploadPdfToPinata,
  uploadPdfToPinata,
} from "@/lib/pinata";
import { requiresPersistentPdfStorage } from "@/lib/env";

export const runtime = "nodejs";

// ============================================================
// GET /api/documents — list dokumen (admin only)
// Query params opsional: search, documentType, faculty, status
// ============================================================
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const documentType = parseDocumentType(searchParams.get("documentType"));
    const faculty = parseFaculty(searchParams.get("faculty"));
    const status = parseDocumentStatus(searchParams.get("status"));
    const pagination = parsePagination(searchParams);

    const where: Prisma.DocumentWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { ownerName: { contains: search } },
        { ownerIdentity: { contains: search } },
        { hashSHA256: { contains: search } },
      ];
    }
    if (documentType) where.documentType = documentType;
    if (faculty) where.faculty = faculty;
    if (status) where.status = status;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
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

// ============================================================
// POST /api/documents — daftarkan dokumen baru (admin only)
// Body: FormData { file, title, documentType, ownerName, ownerIdentity,
//                  faculty, studyProgram, documentYear }
// ============================================================
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    assertCsrfToken(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("validation", "File PDF wajib diunggah.", 400);
    }
    const pdfBuffer = await readValidatedPdfBuffer(file);

    // Validasi metadata
    const input = validateRegisterDocumentInput({
      title: formData.get("title"),
      documentType: formData.get("documentType"),
      ownerName: formData.get("ownerName"),
      ownerIdentity: formData.get("ownerIdentity"),
      faculty: formData.get("faculty"),
      studyProgram: formData.get("studyProgram"),
      documentYear: formData.get("documentYear"),
    });

    // Hitung hash SHA-256 dari file (server-side, authoritative)
    const hashSHA256 = computeSHA256FromBuffer(pdfBuffer);

    // Simpan file ke disk dulu (dipakai untuk Pinata upload juga via File object)
    const saved = await saveUploadedFile(file, hashSHA256, pdfBuffer);

    const pinataLabel = `${input.title}-${file.name}`;
    const pinataRequired = requiresPersistentPdfStorage();
    let pinataResult = null;
    try {
      pinataResult = pinataRequired
        ? await uploadPdfToPinata(file, pinataLabel)
        : await tryUploadPdfToPinata(file, pinataLabel);
    } catch (pinataError) {
      await deleteUploadedFile(saved.filePath);
      throw pinataError;
    }

    // Insert ke DB — andalkan unique constraint hashSHA256 untuk cegah duplikat
    try {
      const document = await prisma.document.create({
        data: {
          title: input.title,
          documentType: input.documentType,
          ownerName: input.ownerName,
          ownerIdentity: input.ownerIdentity,
          faculty: input.faculty,
          studyProgram: input.studyProgram,
          documentYear: input.documentYear,
          fileName: saved.fileName,
          filePath: saved.filePath,
          hashSHA256,
          ipfsCid: pinataResult?.cid ?? null,
          ipfsFileId: pinataResult?.id ?? null,
          status: "ACTIVE",
        },
      });

      await writeAuditLog({
        adminId: session.adminId,
        action: "DOCUMENT_CREATED",
        request,
        targetType: "Document",
        targetId: document.id,
        metadata: {
          title: document.title,
          documentType: document.documentType,
          hashSHA256: document.hashSHA256,
        },
      });

      return NextResponse.json({ document }, { status: 201 });
    } catch (dbError) {
      // Rollback: hapus file dari disk
      await deleteUploadedFile(saved.filePath);
      if (pinataResult?.id) {
        await tryDeleteFile(pinataResult.id);
      }

      // Tangkap unique constraint violation Prisma (P2002)
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2002"
      ) {
        // Ambil dokumen existing untuk pesan error informatif
        const existing = await prisma.document.findUnique({
          where: { hashSHA256 },
          select: { id: true, title: true },
        });
        throw new AppError(
          "validation",
          existing
            ? `Dokumen dengan hash ini sudah terdaftar (ID #${existing.id}: ${existing.title}).`
            : "Dokumen dengan hash ini sudah terdaftar.",
          409
        );
      }

      throw dbError;
    }
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
