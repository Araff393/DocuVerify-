import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { requireAdmin, verifyPassword, hashPassword } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { AppError, toAppError } from "@/lib/errors";
import { changePasswordSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    assertCsrfToken(request);

    const body = await request.json();
    const input = changePasswordSchema.parse(body);

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });
    if (!admin) {
      throw new AppError("auth", "Admin tidak ditemukan.", 401);
    }

    const currentPasswordValid = await verifyPassword(
      input.currentPassword,
      admin.passwordHash
    );
    if (!currentPasswordValid) {
      throw new AppError("auth", "Password lama tidak sesuai.", 401);
    }

    const passwordHash = await hashPassword(input.newPassword);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    await writeAuditLog({
      adminId: admin.id,
      action: "PASSWORD_CHANGED",
      request,
      targetType: "Admin",
      targetId: admin.id,
      metadata: { email: admin.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
