import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { AppError, toAppError } from "@/lib/errors";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    assertRateLimit({
      key: `login:${getClientIp(request)}:${email}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
      message:
        "Terlalu banyak percobaan login. Silakan coba lagi dalam 10 menit.",
    });

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new AppError("auth", "Email atau password salah.", 401);
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      throw new AppError("auth", "Email atau password salah.", 401);
    }

    await createSession({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    });

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
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
