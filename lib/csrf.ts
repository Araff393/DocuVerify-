import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { AppError } from "@/lib/errors";

export const CSRF_COOKIE_NAME = "docuverify_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_MAX_AGE_SECONDS = 60 * 60;

export function createCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function assertCsrfToken(request: Request): void {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = parseCookieHeader(request.headers.get("cookie")).get(
    CSRF_COOKIE_NAME
  );

  if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken)) {
    throw new AppError(
      "auth",
      "Token keamanan tidak valid. Muat ulang halaman dan coba lagi.",
      403
    );
  }
}
