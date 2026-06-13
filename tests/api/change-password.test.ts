import { describe, expect, it } from "vitest";

import { POST as changePasswordPOST } from "@/app/api/auth/change-password/route";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { createAdminAndLogin, createCsrfHeadersForTest } from "../helpers";

function makeChangePasswordRequest(
  body: Record<string, string>,
  csrf = true
) {
  return new Request("http://test/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? createCsrfHeadersForTest() : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/change-password", () => {
  it("berhasil mengubah password dan mencatat audit log", async () => {
    const { admin } = await createAdminAndLogin({
      email: "change@uny.ac.id",
      password: "oldPassword123",
    });

    const res = await changePasswordPOST(
      makeChangePasswordRequest({
        currentPassword: "oldPassword123",
        newPassword: "newPassword12345",
        confirmPassword: "newPassword12345",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    const updated = await prisma.admin.findUnique({ where: { id: admin.id } });
    expect(updated).not.toBeNull();
    await expect(
      verifyPassword("newPassword12345", updated!.passwordHash)
    ).resolves.toBe(true);

    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        adminId: admin.id,
        action: "PASSWORD_CHANGED",
        targetType: "Admin",
        targetId: String(admin.id),
      },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog?.metadata).toContain("change@uny.ac.id");
  });

  it("menolak password lama yang salah", async () => {
    await createAdminAndLogin({ password: "oldPassword123" });

    const res = await changePasswordPOST(
      makeChangePasswordRequest({
        currentPassword: "wrongPassword123",
        newPassword: "newPassword12345",
        confirmPassword: "newPassword12345",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.category).toBe("auth");
  });

  it("menolak konfirmasi password yang tidak cocok", async () => {
    await createAdminAndLogin({ password: "oldPassword123" });

    const res = await changePasswordPOST(
      makeChangePasswordRequest({
        currentPassword: "oldPassword123",
        newPassword: "newPassword12345",
        confirmPassword: "different12345",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
  });

  it("menolak password baru yang terlalu pendek", async () => {
    await createAdminAndLogin({ password: "oldPassword123" });

    const res = await changePasswordPOST(
      makeChangePasswordRequest({
        currentPassword: "oldPassword123",
        newPassword: "short",
        confirmPassword: "short",
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/12 karakter/i);
  });

  it("menolak request tanpa CSRF", async () => {
    await createAdminAndLogin({ password: "oldPassword123" });

    const res = await changePasswordPOST(
      makeChangePasswordRequest(
        {
          currentPassword: "oldPassword123",
          newPassword: "newPassword12345",
          confirmPassword: "newPassword12345",
        },
        false
      )
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.category).toBe("auth");
  });
});
