import "server-only";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { AppError } from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/constants";
import type { SessionPayload } from "@/lib/types";

// ============================================================
// Secret key untuk sign JWT
// ============================================================
function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET belum dikonfigurasi. Set di .env.local (min 32 karakter)."
    );
  }
  return new TextEncoder().encode(secret);
}

// ============================================================
// Password hashing (bcrypt)
// ============================================================
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ============================================================
// Session management (JWT di httpOnly cookie)
// ============================================================

/**
 * Buat session baru — sign JWT dengan admin payload, set ke httpOnly cookie.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

/**
 * Baca session aktif dari cookie. Return null jika tidak ada / invalid / expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Verify JWT token (dipakai di middleware Edge runtime).
 * Middleware harus pakai ini langsung karena `cookies()` tidak tersedia di Edge.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Hapus session (logout).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================================
// Helper: wajib admin (throw AppError 401 jika tidak login)
// ============================================================
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AppError("auth", "Admin harus login terlebih dahulu.", 401);
  }
  return session;
}
