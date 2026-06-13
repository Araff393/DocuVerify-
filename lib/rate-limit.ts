import "server-only";

import { AppError } from "@/lib/errors";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __docuverifyRateLimits?: Map<string, RateLimitBucket>;
};

function getStore(): Map<string, RateLimitBucket> {
  if (!globalForRateLimit.__docuverifyRateLimits) {
    globalForRateLimit.__docuverifyRateLimits = new Map();
  }
  return globalForRateLimit.__docuverifyRateLimits;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function assertRateLimit({
  key,
  limit,
  windowMs,
  message = "Terlalu banyak permintaan. Silakan coba lagi nanti.",
}: RateLimitOptions): void {
  // Bypass rate limit untuk E2E testing (TestSprite)
  if (process.env.DISABLE_RATE_LIMIT === "true") return;

  const now = Date.now();
  const store = getStore();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.count >= limit) {
    throw new AppError("rate_limit", message, 429);
  }

  bucket.count += 1;
}

export function clearRateLimitsForTest(): void {
  getStore().clear();
}
