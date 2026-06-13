import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { destroySession, requireAdmin } from "@/lib/auth";
import { assertCsrfToken } from "@/lib/csrf";
import { toAppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    assertCsrfToken(request);

    await writeAuditLog({
      adminId: session.adminId,
      action: "LOGOUT",
      request,
      targetType: "Admin",
      targetId: session.adminId,
      metadata: { email: session.email },
    });

    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json(
      { error: appError.toJSON() },
      { status: appError.statusCode }
    );
  }
}
