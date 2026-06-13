import { describe, it, expect, vi } from "vitest";

import { GET as documentsGET, POST as documentsPOST } from "@/app/api/documents/route";
import { prisma } from "@/lib/db";
import {
  createCsrfHeadersForTest,
  createAdminAndLogin,
  createSeedDocument,
  makePdfFile,
  makeFormDataRequest,
} from "../helpers";

// ============================================================
// Mock saveUploadedFile dan deleteUploadedFile supaya test tidak
// menulis file ke filesystem. Fungsi lain di lib/upload (assertPdfFile,
// computeSHA256FromFile) tetap pakai implementasi asli.
// ============================================================
vi.mock("@/lib/upload", async () => {
  const actual = await vi.importActual<typeof import("@/lib/upload")>(
    "@/lib/upload"
  );
  return {
    ...actual,
    saveUploadedFile: vi.fn(async (file: File, hash: string) => ({
      fileName: file.name,
      filePath: `uploads/test-${hash.slice(0, 8)}.pdf`,
      storedName: `test-${hash.slice(0, 8)}.pdf`,
    })),
    deleteUploadedFile: vi.fn(async () => {
      // no-op untuk test
    }),
  };
});

const VALID_METADATA = {
  title: "Sertifikat Test",
  documentType: "Sertifikat Akademik",
  ownerName: "Mahasiswa Test",
  ownerIdentity: "20108888888",
  faculty: "Fakultas Teknik",
  studyProgram: "Pendidikan Teknik Informatika",
  documentYear: "2024",
};

function makeDocumentPost(fields: Record<string, string | File>) {
  return makeFormDataRequest(
    "http://test/api/documents",
    fields,
    "POST",
    createCsrfHeadersForTest()
  );
}

describe("POST /api/documents (admin only)", () => {
  it("GET memakai pagination dan mengabaikan filter invalid dengan aman", async () => {
    await createAdminAndLogin();
    for (let i = 0; i < 25; i++) {
      await createSeedDocument({ title: `Dokumen ${i}` });
    }

    const req = new Request(
      "http://test/api/documents?page=2&limit=10&status=UNKNOWN&documentType=INVALID"
    );
    const res = await documentsGET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.documents).toHaveLength(10);
    expect(json.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it("sukses register dokumen baru → 201 + dokumen di DB", async () => {
    await createAdminAndLogin();
    const { file, sha256 } = makePdfFile("%PDF-1.4\nDokumen baru\n%%EOF");

    const req = makeDocumentPost({
      ...VALID_METADATA,
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.document).toBeDefined();
    expect(json.document.title).toBe("Sertifikat Test");
    expect(json.document.hashSHA256).toBe(sha256);
    expect(json.document.status).toBe("ACTIVE");
    // Pinata kosong di .env.test → ipfsCid harus null
    expect(json.document.ipfsCid).toBeNull();
    expect(json.document.ipfsFileId).toBeNull();

    // Verifikasi tersimpan di DB
    const inDb = await prisma.document.findUnique({
      where: { hashSHA256: sha256 },
    });
    expect(inDb).not.toBeNull();
    expect(inDb?.ownerName).toBe("Mahasiswa Test");

    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: "DOCUMENT_CREATED",
        targetType: "Document",
        targetId: String(json.document.id),
      },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog?.metadata).toContain("Sertifikat Test");
  });

  it("401 ketika admin belum login (tanpa session)", async () => {
    // Jangan panggil createAdminAndLogin
    const { file } = makePdfFile();

    const req = makeDocumentPost({
      ...VALID_METADATA,
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.category).toBe("auth");
  });

  it("403 ketika admin login tapi CSRF token tidak dikirim", async () => {
    await createAdminAndLogin();
    const { file } = makePdfFile();

    const req = makeFormDataRequest("http://test/api/documents", {
      ...VALID_METADATA,
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.category).toBe("auth");
  });

  it("400 ketika file PDF tidak diunggah", async () => {
    await createAdminAndLogin();

    const formData = new FormData();
    formData.append("title", VALID_METADATA.title);
    // ...semua field metadata, tapi tanpa file
    for (const [key, val] of Object.entries(VALID_METADATA)) {
      formData.append(key, val);
    }
    const req = new Request("http://test/api/documents", {
      method: "POST",
      headers: createCsrfHeadersForTest(),
      body: formData,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/PDF/i);
  });

  it("400 ketika metadata tidak lengkap (judul kosong)", async () => {
    await createAdminAndLogin();
    const { file } = makePdfFile();

    const req = makeDocumentPost({
      ...VALID_METADATA,
      title: "", // judul kosong
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
  });

  it("400 ketika fakultas bukan dari list valid", async () => {
    await createAdminAndLogin();
    const { file } = makePdfFile();

    const req = makeDocumentPost({
      ...VALID_METADATA,
      faculty: "Fakultas Antah Berantah",
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
  });

  it("400 ketika jenis dokumen lama tidak lagi valid", async () => {
    await createAdminAndLogin();
    const { file } = makePdfFile();

    const req = makeDocumentPost({
      ...VALID_METADATA,
      documentType: "Skripsi",
      file,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/Jenis dokumen/i);
  });

  it("400 ketika tahun di luar range (1999)", async () => {
    await createAdminAndLogin();
    const { file } = makePdfFile();

    const req = makeDocumentPost({
      ...VALID_METADATA,
      documentYear: "1999",
      file,
    });

    const res = await documentsPOST(req);
    expect(res.status).toBe(400);
  });

  it("409 ketika hash duplicate (Prisma P2002)", async () => {
    await createAdminAndLogin();
    const { file: file1 } = makePdfFile("%PDF-1.4\nIdentik\n%%EOF");
    const { file: file2 } = makePdfFile("%PDF-1.4\nIdentik\n%%EOF");

    // Register pertama → sukses
    const req1 = makeDocumentPost({
      ...VALID_METADATA,
      title: "Pertama",
      file: file1,
    });
    const res1 = await documentsPOST(req1);
    expect(res1.status).toBe(201);

    // Register kedua dengan konten sama → harus 409
    const req2 = makeDocumentPost({
      ...VALID_METADATA,
      title: "Kedua",
      file: file2,
    });
    const res2 = await documentsPOST(req2);
    const json2 = await res2.json();

    expect(res2.status).toBe(409);
    expect(json2.error.category).toBe("validation");
    expect(json2.error.message).toMatch(/sudah terdaftar/i);
    // Pesan informatif harus mengandung ID dan title dokumen pertama
    expect(json2.error.message).toMatch(/Pertama/);

    // Hanya ada 1 dokumen di DB
    const count = await prisma.document.count();
    expect(count).toBe(1);
  });

  it("file > 10 MB ditolak (assertPdfFile)", async () => {
    await createAdminAndLogin();

    // Buat PDF 11 MB
    const bigContent = "x".repeat(11 * 1024 * 1024);
    const bigFile = new File([bigContent], "big.pdf", {
      type: "application/pdf",
    });

    const req = makeDocumentPost({
      ...VALID_METADATA,
      file: bigFile,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.message).toMatch(/10 MB/);
  });

  it("file dengan ekstensi non-PDF ditolak", async () => {
    await createAdminAndLogin();

    const txtFile = new File(["plain text"], "test.txt", {
      type: "text/plain",
    });

    const req = makeDocumentPost({
      ...VALID_METADATA,
      file: txtFile,
    });

    const res = await documentsPOST(req);
    expect(res.status).toBe(400);
  });

  it("file berekstensi PDF tapi magic bytes tidak valid ditolak", async () => {
    await createAdminAndLogin();

    const fakePdf = new File(["plain text"], "fake.pdf", {
      type: "application/pdf",
    });

    const req = makeDocumentPost({
      ...VALID_METADATA,
      file: fakePdf,
    });

    const res = await documentsPOST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.category).toBe("validation");
    expect(json.error.message).toMatch(/PDF/i);
  });
});
