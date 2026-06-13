import { describe, it, expect } from "vitest";

import { POST as verifyPOST } from "@/app/api/verify/route";
import { prisma } from "@/lib/db";
import { createSeedDocument, makePdfFile, makeFormDataRequest } from "../helpers";

describe("POST /api/verify (publik, tanpa auth)", () => {
  it("VALID — hash cocok dan dokumen ACTIVE", async () => {
    // Generate file dulu, baru pakai hashnya untuk seed dokumen
    const { file, sha256 } = makePdfFile("%PDF-1.4\nDokumen valid\n%%EOF");

    const seeded = await createSeedDocument({
      title: "Sertifikat Valid",
      hashSHA256: sha256,
      status: "ACTIVE",
    });

    const req = makeFormDataRequest("http://test/api/verify", { file });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("VALID");
    expect(json.uploadedHash).toBe(sha256);
    expect(json.referenceHash).toBe(sha256);
    expect(json.document).toBeDefined();
    expect(json.document.id).toBe(seeded.id);
    expect(json.document.title).toBe("Sertifikat Valid");
    expect(json.document.ownerName).not.toBe("Mahasiswa Uji");
    expect(json.document.ownerName).toContain("*");
    expect(json.document.ownerIdentity).not.toBe("20108999999");
    expect(json.document.ownerIdentity).toContain("*");

    // Log tersimpan
    const logs = await prisma.verificationLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("VALID");
    expect(logs[0].documentId).toBe(seeded.id);
    expect(logs[0].uploadedHash).toBe(sha256);
  });

  it("NOT_REGISTERED — hash tidak ditemukan", async () => {
    const { file, sha256 } = makePdfFile("%PDF-1.4\nTidak terdaftar\n%%EOF");

    // Tidak ada seed — DB kosong
    const req = makeFormDataRequest("http://test/api/verify", { file });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("NOT_REGISTERED");
    expect(json.uploadedHash).toBe(sha256);
    expect(json.referenceHash).toBeUndefined();
    expect(json.document).toBeUndefined();

    // Log tetap tersimpan dengan documentId null
    const logs = await prisma.verificationLog.findMany();
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("NOT_REGISTERED");
    expect(logs[0].documentId).toBeNull();
  });

  it("INVALID — hash cocok tapi dokumen REVOKED", async () => {
    const { file, sha256 } = makePdfFile("%PDF-1.4\nDokumen dicabut\n%%EOF");

    const seeded = await createSeedDocument({
      title: "Sertifikat Dicabut",
      hashSHA256: sha256,
      status: "REVOKED",
    });

    const req = makeFormDataRequest("http://test/api/verify", { file });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe("INVALID");
    expect(json.uploadedHash).toBe(sha256);
    expect(json.referenceHash).toBe(sha256);
    // Document tidak di-include karena status bukan VALID
    expect(json.document).toBeUndefined();

    const logs = await prisma.verificationLog.findMany();
    expect(logs[0].status).toBe("INVALID");
    expect(logs[0].documentId).toBe(seeded.id);
  });

  it("400 ketika file bukan PDF (txt)", async () => {
    const txtFile = new File(["plain text"], "test.txt", {
      type: "text/plain",
    });

    const req = makeFormDataRequest("http://test/api/verify", {
      file: txtFile,
    });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/PDF/i);
  });

  it("400 ketika file berekstensi PDF tapi magic bytes tidak valid", async () => {
    const fakePdf = new File(["plain text"], "fake.pdf", {
      type: "application/pdf",
    });

    const req = makeFormDataRequest("http://test/api/verify", {
      file: fakePdf,
    });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/PDF/i);
  });

  it("400 ketika file tidak diunggah", async () => {
    // FormData kosong
    const formData = new FormData();
    const req = new Request("http://test/api/verify", {
      method: "POST",
      body: formData,
    });

    const res = await verifyPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
  });

  it("file PDF identik tapi hashnya beda → NOT_REGISTERED (avalanche effect)", async () => {
    const { file: file1 } = makePdfFile("%PDF-1.4\nKonten A\n%%EOF");
    const { file: file2, sha256: hash2 } = makePdfFile(
      "%PDF-1.4\nKonten B\n%%EOF"
    );

    // Seed pakai hash dari file1
    const { sha256: hash1 } = makePdfFile("%PDF-1.4\nKonten A\n%%EOF");
    await createSeedDocument({
      hashSHA256: hash1,
      status: "ACTIVE",
    });

    // Verifikasi pakai file2 — hash beda, harus NOT_REGISTERED
    void file1;
    const req = makeFormDataRequest("http://test/api/verify", { file: file2 });
    const res = await verifyPOST(req);
    const json = await res.json();

    expect(json.status).toBe("NOT_REGISTERED");
    expect(json.uploadedHash).toBe(hash2);
    expect(hash1).not.toBe(hash2);
  });

  it("rate limit verifikasi pada request ke-31 untuk IP sama → 429", async () => {
    function makeVerifyRequest(index: number) {
      const { file } = makePdfFile(`%PDF-1.4\nRate limit ${index}\n%%EOF`);
      const formData = new FormData();
      formData.append("file", file);
      return new Request("http://test/api/verify", {
        method: "POST",
        headers: {
          "x-forwarded-for": "198.51.100.20",
        },
        body: formData,
      });
    }

    for (let i = 0; i < 30; i++) {
      const res = await verifyPOST(makeVerifyRequest(i));
      expect(res.status).toBe(200);
    }

    const limitedRes = await verifyPOST(makeVerifyRequest(31));
    const json = await limitedRes.json();

    expect(limitedRes.status).toBe(429);
    expect(json.error.category).toBe("rate_limit");
  });
});
