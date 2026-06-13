import { describe, expect, it } from "vitest";

import { GET as auditLogsGET } from "@/app/api/audit-logs/route";
import { prisma } from "@/lib/db";
import { createAdminAndLogin } from "../helpers";

describe("GET /api/audit-logs", () => {
  it("menolak akses ketika admin belum login", async () => {
    const res = await auditLogsGET(new Request("http://test/api/audit-logs"));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.category).toBe("auth");
  });

  it("mendukung pagination dan filter action", async () => {
    const { admin } = await createAdminAndLogin();

    await prisma.adminAuditLog.createMany({
      data: [
        {
          adminId: admin.id,
          action: "DOCUMENT_CREATED",
          targetType: "Document",
          targetId: "1",
        },
        {
          adminId: admin.id,
          action: "LOGOUT",
          targetType: "Admin",
          targetId: String(admin.id),
        },
        {
          adminId: admin.id,
          action: "LOGOUT",
          targetType: "Admin",
          targetId: String(admin.id),
        },
      ],
    });

    const res = await auditLogsGET(
      new Request("http://test/api/audit-logs?action=LOGOUT&page=2&limit=1")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.auditLogs).toHaveLength(1);
    expect(json.auditLogs[0].action).toBe("LOGOUT");
    expect(json.auditLogs[0].admin.email).toBe(admin.email);
    expect(json.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });
});
