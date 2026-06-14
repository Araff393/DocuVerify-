/**
 * Prisma Seed — DocuVerify UNY MVP
 *
 * Jalankan via: npm run db:seed  (atau: npx tsx prisma/seed.ts)
 *
 * Membuat:
 *  - 1 admin default dengan password di-hash bcrypt
 *  - 8 dokumen akademik (migrasi dari lib/mock-data.ts)
 *  - 8 verification log (migrasi dari lib/mock-data.ts)
 *
 * Script bersifat idempotent: re-run aman, data di-upsert berdasarkan
 * field unik (email untuk Admin, hashSHA256 untuk Document).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generatePublicCode, isDocuVerifyPublicCode } from "@/lib/public-document";

const prisma = new PrismaClient();

// ============================================================
// Konstanta Admin Seed
// ============================================================
function getRequiredAdminSeedPassword(): string {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      "ADMIN_SEED_PASSWORD wajib diisi dengan minimal 8 karakter sebelum menjalankan seed."
    );
  }
  return password;
}

const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_SEED_EMAIL?.trim() || "admin@uny.ac.id";
const DEFAULT_ADMIN_PASSWORD = getRequiredAdminSeedPassword();
const DEFAULT_ADMIN_NAME = process.env.ADMIN_SEED_NAME?.trim() || "Administrator";

// ============================================================
// Data dokumen (mirror dari lib/mock-data.ts)
// ============================================================
type DocumentSeed = {
  title: string;
  documentType:
    | "Sertifikat Akademik"
    | "Sertifikat Lainnya";
  ownerName: string;
  ownerIdentity: string;
  faculty: string;
  studyProgram: string;
  documentYear: number;
  fileName: string;
  filePath: string;
  hashSHA256: string;
  publicCode?: string;
  ipfsCid?: string;
  status?: "ACTIVE" | "REVOKED";
  createdAt: Date;
};

const documentSeeds: DocumentSeed[] = [
  {
    title: "Pengembangan Sistem Informasi Akademik Berbasis Web",
    documentType: "Sertifikat Akademik",
    ownerName: "Ahmad Fauzan Hakim",
    ownerIdentity: "20108241015",
    faculty: "Fakultas Teknik",
    studyProgram: "Pendidikan Teknik Informatika",
    documentYear: 2024,
    fileName: "skripsi_ahmad_fauzan.pdf",
    filePath: "/uploads/skripsi_ahmad_fauzan.pdf",
    hashSHA256: "a3f2c8e91d4b7f6a0e5c3d2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
    publicCode: "DOC-UNY-2024-AFHA01",
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    createdAt: new Date("2024-11-15T08:30:00Z"),
  },
  {
    title: "Lembar Pengesahan Skripsi — Pendidikan Teknik Informatika",
    documentType: "Sertifikat Akademik",
    ownerName: "Ahmad Fauzan Hakim",
    ownerIdentity: "20108241015",
    faculty: "Fakultas Teknik",
    studyProgram: "Pendidikan Teknik Informatika",
    documentYear: 2024,
    fileName: "pengesahan_ahmad_fauzan.pdf",
    filePath: "/uploads/pengesahan_ahmad_fauzan.pdf",
    hashSHA256: "b4e3d9f02e5c8a7b1f6d4e3c2b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2",
    publicCode: "DOC-UNY-2024-AFHA02",
    createdAt: new Date("2024-11-15T09:00:00Z"),
  },
  {
    title: "Analisis Pengaruh Model Pembelajaran Kooperatif Terhadap Hasil Belajar Matematika",
    documentType: "Sertifikat Akademik",
    ownerName: "Siti Nurhaliza Putri",
    ownerIdentity: "20301244012",
    faculty: "Fakultas Matematika dan Ilmu Pengetahuan Alam",
    studyProgram: "Pendidikan Matematika",
    documentYear: 2024,
    fileName: "skripsi_siti_nurhaliza.pdf",
    filePath: "/uploads/skripsi_siti_nurhaliza.pdf",
    hashSHA256: "c5f4e0a13f6d9b8c2a7e5f4d3c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3",
    publicCode: "DOC-UNY-2024-SNHP01",
    ipfsCid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    createdAt: new Date("2024-10-20T10:15:00Z"),
  },
  {
    title: "Surat Pernyataan Keaslian Skripsi",
    documentType: "Sertifikat Akademik",
    ownerName: "Siti Nurhaliza Putri",
    ownerIdentity: "20301244012",
    faculty: "Fakultas Matematika dan Ilmu Pengetahuan Alam",
    studyProgram: "Pendidikan Matematika",
    documentYear: 2024,
    fileName: "pernyataan_keaslian_siti.pdf",
    filePath: "/uploads/pernyataan_keaslian_siti.pdf",
    hashSHA256: "d6a5f1b24a7e0c9d3b8f6a5e4d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4",
    publicCode: "DOC-UNY-2024-SNHP02",
    createdAt: new Date("2024-10-20T10:30:00Z"),
  },
  {
    title: "Penerapan Metode Design Thinking dalam Perancangan UI/UX Aplikasi Mobile",
    documentType: "Sertifikat Akademik",
    ownerName: "Rizky Aditya Pratama",
    ownerIdentity: "20108241023",
    faculty: "Fakultas Teknik",
    studyProgram: "Pendidikan Teknik Informatika",
    documentYear: 2025,
    fileName: "skripsi_rizky_aditya.pdf",
    filePath: "/uploads/skripsi_rizky_aditya.pdf",
    hashSHA256: "e7b6a2c35b8f1d0e4c9a7b6f5e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5",
    publicCode: "DOC-UNY-2025-RAPR01",
    ipfsCid: "QmZtMRBp7rPQHQTV6cLzA8EXP8rNzLMfNb7Eokkx2sYtjy",
    createdAt: new Date("2025-01-12T14:00:00Z"),
  },
  {
    title: "Artikel Tugas Akhir — Efektivitas Media Pembelajaran Interaktif",
    documentType: "Sertifikat Akademik",
    ownerName: "Dewi Kartika Sari",
    ownerIdentity: "20205241008",
    faculty: "Fakultas Ilmu Pendidikan dan Psikologi",
    studyProgram: "Teknologi Pendidikan",
    documentYear: 2025,
    fileName: "artikel_dewi_kartika.pdf",
    filePath: "/uploads/artikel_dewi_kartika.pdf",
    hashSHA256: "f8c7b3d46c9a2e1f5d0b8c7a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6",
    publicCode: "DOC-UNY-2025-DKSA01",
    createdAt: new Date("2025-02-28T11:45:00Z"),
  },
  {
    title: "Hubungan Antara Kecerdasan Emosional dan Prestasi Akademik Mahasiswa",
    documentType: "Sertifikat Akademik",
    ownerName: "Bayu Setiawan",
    ownerIdentity: "20401241019",
    faculty: "Fakultas Ilmu Sosial, Hukum dan Ilmu Politik",
    studyProgram: "Pendidikan Kewarganegaraan",
    documentYear: 2024,
    fileName: "skripsi_bayu_setiawan.pdf",
    filePath: "/uploads/skripsi_bayu_setiawan.pdf",
    hashSHA256: "09d8c4e57d0b3f2a6e1c9d8b7a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7",
    publicCode: "DOC-UNY-2024-BSET01",
    createdAt: new Date("2024-09-05T09:20:00Z"),
  },
  {
    title: "Surat Keterangan Lulus Ujian Skripsi",
    documentType: "Sertifikat Lainnya",
    ownerName: "Anisa Rahmawati",
    ownerIdentity: "20502241007",
    faculty: "Fakultas Ekonomi dan Bisnis",
    studyProgram: "Manajemen",
    documentYear: 2025,
    fileName: "surat_lulus_anisa.pdf",
    filePath: "/uploads/surat_lulus_anisa.pdf",
    hashSHA256: "1ae9d5f68e1c4a3b7f2d0e9c8b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8",
    publicCode: "DOC-UNY-2025-ANRA01",
    createdAt: new Date("2025-03-10T16:00:00Z"),
  },
];

// ============================================================
// Data verification log (mirror dari lib/mock-data.ts)
// Mengacu ke dokumen via hashSHA256 (akan di-resolve ke ID).
// ============================================================
type VerificationSeed = {
  uploadedHash: string;
  status: "VALID" | "NOT_REGISTERED" | "INVALID";
  /** hashSHA256 dari Document yang terkait (jika ada) */
  relatedDocumentHash?: string;
  createdAt: Date;
};

const verificationSeeds: VerificationSeed[] = [
  {
    uploadedHash: "a3f2c8e91d4b7f6a0e5c3d2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
    status: "VALID",
    relatedDocumentHash: "a3f2c8e91d4b7f6a0e5c3d2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
    createdAt: new Date("2025-04-20T10:30:00Z"),
  },
  {
    uploadedHash: "ff00aa11bb22cc33dd44ee55ff66aa77bb88cc99dd00ee11ff22aa33bb44cc55",
    status: "NOT_REGISTERED",
    createdAt: new Date("2025-04-19T14:15:00Z"),
  },
  {
    uploadedHash: "c5f4e0a13f6d9b8c2a7e5f4d3c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3",
    status: "VALID",
    relatedDocumentHash: "c5f4e0a13f6d9b8c2a7e5f4d3c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3",
    createdAt: new Date("2025-04-18T08:45:00Z"),
  },
  {
    uploadedHash: "aabbccdd1122334455667788990011223344556677889900aabbccddeeff0011",
    status: "NOT_REGISTERED",
    createdAt: new Date("2025-04-17T16:20:00Z"),
  },
  {
    uploadedHash: "e7b6a2c35b8f1d0e4c9a7b6f5e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5",
    status: "VALID",
    relatedDocumentHash: "e7b6a2c35b8f1d0e4c9a7b6f5e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5",
    createdAt: new Date("2025-04-16T11:10:00Z"),
  },
  {
    uploadedHash: "112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
    status: "INVALID",
    relatedDocumentHash: "a3f2c8e91d4b7f6a0e5c3d2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
    createdAt: new Date("2025-04-15T09:30:00Z"),
  },
  {
    uploadedHash: "f8c7b3d46c9a2e1f5d0b8c7a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6",
    status: "VALID",
    relatedDocumentHash: "f8c7b3d46c9a2e1f5d0b8c7a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6",
    createdAt: new Date("2025-04-14T13:55:00Z"),
  },
  {
    uploadedHash: "deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
    status: "NOT_REGISTERED",
    createdAt: new Date("2025-04-13T15:40:00Z"),
  },
];

// ============================================================
// Seed runner
// ============================================================
async function main() {
  console.log("🌱  Seeding DocuVerify UNY database…");

  // --- Admin ---
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const admin = await prisma.admin.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: { name: DEFAULT_ADMIN_NAME, passwordHash },
    create: {
      name: DEFAULT_ADMIN_NAME,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
    },
  });
  console.log(`✔  Admin ready: ${admin.email}`);

  // --- Documents ---
  for (const seed of documentSeeds) {
    const publicCode = seed.publicCode ?? generatePublicCode(seed.documentYear);
    await prisma.document.upsert({
      where: { hashSHA256: seed.hashSHA256 },
      update: {
        title: seed.title,
        documentType: seed.documentType,
        ownerName: seed.ownerName,
        ownerIdentity: seed.ownerIdentity,
        faculty: seed.faculty,
        studyProgram: seed.studyProgram,
        documentYear: seed.documentYear,
        fileName: seed.fileName,
        filePath: seed.filePath,
        publicCode,
        ipfsCid: seed.ipfsCid ?? null,
        status: seed.status ?? "ACTIVE",
      },
      create: {
        title: seed.title,
        documentType: seed.documentType,
        ownerName: seed.ownerName,
        ownerIdentity: seed.ownerIdentity,
        faculty: seed.faculty,
        studyProgram: seed.studyProgram,
        documentYear: seed.documentYear,
        fileName: seed.fileName,
        filePath: seed.filePath,
        publicCode,
        hashSHA256: seed.hashSHA256,
        ipfsCid: seed.ipfsCid ?? null,
        status: seed.status ?? "ACTIVE",
        createdAt: seed.createdAt,
      },
    });
  }
  console.log(`✔  Documents seeded: ${documentSeeds.length}`);

  const documentsWithoutOfficialCode = await prisma.document.findMany({
    where: {
      NOT: { publicCode: { startsWith: "DOC-UNY-" } },
    },
    select: { id: true, documentYear: true, publicCode: true },
  });

  for (const document of documentsWithoutOfficialCode) {
    if (isDocuVerifyPublicCode(document.publicCode)) continue;

    let publicCode: string | null = null;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = generatePublicCode(document.documentYear);
      const existingCode = await prisma.document.findUnique({
        where: { publicCode: candidate },
        select: { id: true },
      });
      if (!existingCode || existingCode.id === document.id) {
        publicCode = candidate;
        break;
      }
    }

    if (publicCode) {
      await prisma.document.update({
        where: { id: document.id },
        data: { publicCode },
      });
    }
  }
  console.log(`✔  Public codes backfilled: ${documentsWithoutOfficialCode.length}`);

  // --- Verification logs ---
  // Hapus log lama supaya tidak duplikat setiap run (log tidak punya field unik).
  await prisma.verificationLog.deleteMany();

  for (const seed of verificationSeeds) {
    let documentId: number | null = null;
    if (seed.relatedDocumentHash) {
      const doc = await prisma.document.findUnique({
        where: { hashSHA256: seed.relatedDocumentHash },
        select: { id: true },
      });
      documentId = doc?.id ?? null;
    }

    await prisma.verificationLog.create({
      data: {
        uploadedHash: seed.uploadedHash,
        status: seed.status,
        documentId,
        createdAt: seed.createdAt,
      },
    });
  }
  console.log(`✔  Verification logs seeded: ${verificationSeeds.length}`);

  console.log("✨  Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
