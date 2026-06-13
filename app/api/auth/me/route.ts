import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ admin: null }, { status: 200 });
  }
  return NextResponse.json({
    admin: {
      id: session.adminId,
      email: session.email,
      name: session.name,
    },
  });
}
