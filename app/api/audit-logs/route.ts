import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { parseAuditAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toAppError } from "@/lib/errors";
import { parsePagination } from "@/lib/query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const action = parseAuditAction(searchParams.get("action"));
    const pagination = parsePagination(searchParams);

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (action) where.action = action;

    const [auditLogs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs,
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
