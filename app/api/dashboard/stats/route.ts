import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { toAppError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/stats — statistik dashboard (admin only).
 */
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalDocuments,
      totalVerifications,
      validVerifications,
      notRegisteredVerifications,
      invalidVerifications,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.verificationLog.count(),
      prisma.verificationLog.count({ where: { status: "VALID" } }),
      prisma.verificationLog.count({ where: { status: "NOT_REGISTERED" } }),
      prisma.verificationLog.count({ where: { status: "INVALID" } }),
    ]);

    return NextResponse.json({
      stats: {
        totalDocuments,
        totalVerifications,
        validVerifications,
        notRegisteredVerifications,
        invalidVerifications,
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
