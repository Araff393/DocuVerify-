import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { AppError, toAppError } from "@/lib/errors";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function parseId(idStr: string): number {
  const id = parseInt(idStr, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("validation", "ID dokumen tidak valid.", 400);
  }
  return id;
}

// ============================================================
// GET /api/documents/[id] — detail dokumen (admin only)
// ============================================================
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: idStr } = await params;
    const id = parseId(idStr);

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        verifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!document) {
      throw new AppError("not_found", "Dokumen tidak ditemukan.", 404);
    }

    return NextResponse.json({ document });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}

// ============================================================
// DELETE /api/documents/[id] — cabut dokumen (soft delete → status REVOKED)
// ============================================================
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requireAdmin();
    assertCsrfToken(request);
    const { id: idStr } = await params;
    const id = parseId(idStr);

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("not_found", "Dokumen tidak ditemukan.", 404);
    }

    if (existing.status === "REVOKED") {
      throw new AppError(
        "validation",
        "Dokumen sudah dicabut sebelumnya.",
        400
      );
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    await writeAuditLog({
      adminId: session.adminId,
      action: "DOCUMENT_REVOKED",
      request,
      targetType: "Document",
      targetId: document.id,
      metadata: {
        title: document.title,
        hashSHA256: document.hashSHA256,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
