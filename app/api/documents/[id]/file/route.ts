import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { AppError, toAppError } from "@/lib/errors";
import { resolveUploadPath } from "@/lib/upload";
import { fetchPdfFromPinata } from "@/lib/pinata";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/documents/[id]/file
 *   ?download=1  → force download
 *   (default)    → inline preview di browser
 *
 * Admin only — file disimpan di luar public/ supaya tidak bisa diakses langsung.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin();

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("validation", "ID dokumen tidak valid.", 400);
    }

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new AppError("not_found", "Dokumen tidak ditemukan.", 404);
    }

    let fileBuffer: Buffer;
    const fullPath = resolveUploadPath(document.filePath);
    if (existsSync(fullPath)) {
      fileBuffer = await readFile(fullPath);
    } else if (document.ipfsCid) {
      const pinataBuffer = await fetchPdfFromPinata(document.ipfsCid);
      fileBuffer = Buffer.from(pinataBuffer);
    } else {
      throw new AppError(
        "not_found",
        "File dokumen tidak ditemukan di server atau Pinata.",
        404
      );
    }

    const { searchParams } = new URL(request.url);
    const forceDownload = searchParams.get("download") === "1";

    const disposition = forceDownload
      ? `attachment; filename="${encodeURIComponent(document.fileName)}"`
      : `inline; filename="${encodeURIComponent(document.fileName)}"`;

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    const appError = toAppError(error);
    return new Response(JSON.stringify({ error: appError.toJSON() }), {
      status: appError.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
