import { describe, expect, it } from "vitest";

import { DELETE as documentDELETE } from "@/app/api/documents/[id]/route";
import { prisma } from "@/lib/db";
import {
  createAdminAndLogin,
  createCsrfHeadersForTest,
  createSeedDocument,
} from "../helpers";

describe("DELETE /api/documents/[id] (admin only)", () => {
  it("mencabut dokumen ketika session dan CSRF valid", async () => {
    await createAdminAndLogin();
    const document = await createSeedDocument({ status: "ACTIVE" });

    const req = new Request(`http://test/api/documents/${document.id}`, {
      method: "DELETE",
      headers: createCsrfHeadersForTest(),
    });
    const res = await documentDELETE(req, {
      params: Promise.resolve({ id: String(document.id) }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.document.status).toBe("REVOKED");

    const updated = await prisma.document.findUnique({
      where: { id: document.id },
    });
    expect(updated?.status).toBe("REVOKED");

    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: "DOCUMENT_REVOKED",
        targetType: "Document",
        targetId: String(document.id),
      },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog?.metadata).toContain(document.title);
  });

  it("menolak revoke tanpa CSRF token", async () => {
    await createAdminAndLogin();
    const document = await createSeedDocument({ status: "ACTIVE" });

    const req = new Request(`http://test/api/documents/${document.id}`, {
      method: "DELETE",
    });
    const res = await documentDELETE(req, {
      params: Promise.resolve({ id: String(document.id) }),
    });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.category).toBe("auth");
  });
});
