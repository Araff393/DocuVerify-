import { describe, expect, it } from "vitest";

import { POST as logoutPOST } from "@/app/api/auth/logout/route";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAdminAndLogin, createCsrfHeadersForTest } from "../helpers";

describe("POST /api/auth/logout", () => {
  it("menghapus session dan mencatat audit log logout", async () => {
    const { admin } = await createAdminAndLogin({
      email: "logout@uny.ac.id",
      name: "Logout Admin",
    });

    const res = await logoutPOST(
      new Request("http://test/api/auth/logout", {
        method: "POST",
        headers: createCsrfHeadersForTest(),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    await expect(getSession()).resolves.toBeNull();

    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: admin.id,
        action: "LOGOUT",
        targetType: "Admin",
        targetId: String(admin.id),
      },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog?.metadata).toContain("logout@uny.ac.id");
  });

  it("menolak logout tanpa CSRF", async () => {
    await createAdminAndLogin();

    const res = await logoutPOST(
      new Request("http://test/api/auth/logout", { method: "POST" })
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.category).toBe("auth");
    await expect(getSession()).resolves.not.toBeNull();
  });
});
