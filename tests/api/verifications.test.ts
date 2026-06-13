import { describe, expect, it } from "vitest";

import { GET as verificationsGET } from "@/app/api/verifications/route";
import { prisma } from "@/lib/db";
import { createAdminAndLogin, createSeedDocument } from "../helpers";

describe("GET /api/verifications", () => {
  it("scope public tidak mengekspos hash penuh, IP, atau metadata pemilik", async () => {
    const document = await createSeedDocument({
      title: "Dokumen Rahasia",
      ownerName: "Nama Rahasia",
      status: "ACTIVE",
    });
    await prisma.verificationLog.create({
      data: {
        uploadedHash: document.hashSHA256,
        status: "VALID",
        documentId: document.id,
        ipAddress: "203.0.113.77",
      },
    });

    const res = await verificationsGET(
      new Request("http://test/api/verifications?scope=public")
    );
    const json = await res.json();
    const serialized = JSON.stringify(json);

    expect(res.status).toBe(200);
    expect(json.verifications).toHaveLength(1);
    expect(json.verifications[0].uploadedHash).toBeUndefined();
    expect(json.verifications[0].uploadedHashPreview).toContain("...");
    expect(json.verifications[0].documentMatched).toBe(true);
    expect(serialized).not.toContain(document.hashSHA256);
    expect(serialized).not.toContain("203.0.113.77");
    expect(serialized).not.toContain("Nama Rahasia");
    expect(serialized).not.toContain("Dokumen Rahasia");
  });

  it("scope admin memakai pagination dan tetap mengembalikan data lengkap", async () => {
    await createAdminAndLogin();
    const document = await createSeedDocument({ status: "ACTIVE" });

    for (let i = 0; i < 25; i++) {
      await prisma.verificationLog.create({
        data: {
          uploadedHash: `${document.hashSHA256.slice(0, 62)}${i
            .toString(16)
            .padStart(2, "0")}`,
          status: "VALID",
          documentId: document.id,
          ipAddress: `198.51.100.${i}`,
        },
      });
    }

    const res = await verificationsGET(
      new Request(
        "http://test/api/verifications?scope=admin&status=VALID&page=2&limit=10"
      )
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.verifications).toHaveLength(10);
    expect(json.verifications[0].uploadedHash).toBeDefined();
    expect(json.verifications[0].ipAddress).toBeDefined();
    expect(json.verifications[0].document.ownerName).toBeDefined();
    expect(json.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });
});
