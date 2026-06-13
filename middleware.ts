import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * Middleware — memproteksi seluruh route /admin/* (kecuali /admin/login).
 *
 * Jika tidak ada session valid di cookie, redirect ke /admin/login.
 * Session di-verify langsung di Edge runtime menggunakan `jose`
 * (bcryptjs & prisma tidak compatible dengan Edge).
 */

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET belum dikonfigurasi di .env.local.");
  }
  return new TextEncoder().encode(secret);
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getAuthSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login tidak perlu auth. Tapi jika sudah login, redirect ke dashboard.
  if (pathname === "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (await isValidSession(token)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Semua /admin/* lain butuh session valid.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!(await isValidSession(token))) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
