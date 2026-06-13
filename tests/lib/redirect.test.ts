import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_REDIRECT,
  getSafeAdminRedirect,
} from "@/lib/redirect";

describe("getSafeAdminRedirect", () => {
  it("menerima path admin internal", () => {
    expect(getSafeAdminRedirect("/admin/dashboard")).toBe("/admin/dashboard");
    expect(getSafeAdminRedirect("/admin/documents?status=ACTIVE")).toBe(
      "/admin/documents?status=ACTIVE"
    );
  });

  it("menolak redirect eksternal dan path tidak aman", () => {
    const unsafeValues = [
      "https://evil.com",
      "//evil.com",
      "/admin/../evil",
      "/admin/%2e%2e/evil",
      "/admin/login",
    ];

    for (const value of unsafeValues) {
      expect(getSafeAdminRedirect(value)).toBe(DEFAULT_ADMIN_REDIRECT);
    }
  });
});
