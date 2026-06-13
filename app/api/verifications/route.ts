import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toAppError } from "@/lib/errors";
import {
  formatHashPreview,
  parsePagination,
  parseVerificationStatus,
} from "@/lib/query";

export const runtime = "nodejs";

/**
 * GET /api/verifications
 *
 *   ?scope=public → riwayat untuk publik (tanpa IP, limit 50)
 *   ?scope=admin  → riwayat lengkap (butuh login admin)
 *
 * Default: public.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "public";
    const statusFilter = parseVerificationStatus(searchParams.get("status"));

    const where: Prisma.VerificationLogWhereInput = {};
    if (statusFilter) where.status = statusFilter;

    if (scope === "admin") {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { error: { category: "auth", message: "Admin harus login." } },
          { status: 401 }
        );
      }

      const pagination = parsePagination(searchParams);
      const [verifications, total] = await Promise.all([
        prisma.verificationLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            document: {
              select: {
                id: true,
                title: true,
                ownerName: true,
                ownerIdentity: true,
              },
            },
          },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        prisma.verificationLog.count({ where }),
      ]);

      return NextResponse.json({
        verifications,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
        },
      });
    }

    // Public scope — tanpa IP address
    const pagination = parsePagination(searchParams, {
      defaultLimit: 50,
      maxLimit: 50,
    });
    const verifications = await prisma.verificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        uploadedHash: true,
        status: true,
        createdAt: true,
        documentId: true,
      },
      skip: pagination.skip,
      take: pagination.limit,
    });

    const total = await prisma.verificationLog.count({ where });

    return NextResponse.json({
      verifications: verifications.map((verification) => ({
        id: verification.id,
        uploadedHashPreview: formatHashPreview(verification.uploadedHash),
        status: verification.status,
        createdAt: verification.createdAt,
        documentMatched: verification.documentId !== null,
      })),
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
