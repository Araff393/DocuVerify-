import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth";
import {
  createCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
} from "@/lib/csrf";
import { toAppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const csrfToken = createCsrfToken();
    const response = NextResponse.json({ csrfToken });

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: CSRF_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
