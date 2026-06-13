import { afterEach, describe, expect, it, vi } from "vitest";

import { toAppError } from "@/lib/errors";

describe("toAppError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("masking internal error ketika production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const appError = toAppError(new Error("secret database error"));

    expect(appError.statusCode).toBe(500);
    expect(appError.category).toBe("internal");
    expect(appError.message).toBe("Terjadi kesalahan server. Silakan coba lagi.");
    expect(appError.message).not.toContain("secret");
    expect(consoleError).toHaveBeenCalled();
  });
});
