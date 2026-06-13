import { NextResponse } from "next/server";

import { listCertificates } from "@/lib/blockchain";
import { toAppError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const certificates = await listCertificates();
    return NextResponse.json({ certificates });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json({ error: appError.toJSON() }, { status: appError.statusCode });
  }
}
