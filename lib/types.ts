// ============================================================
// Domain Types — MVP Spec (Dokumen Akademik UNY)
// ============================================================

/** Jenis dokumen akademik yang tersedia (sesuai spec MVP) */
export type DocumentType =
  | "Sertifikat Akademik"
  | "Sertifikat Lainnya";

/** Fakultas di Universitas Negeri Yogyakarta */
export type Faculty =
  | "Fakultas Ilmu Pendidikan dan Psikologi"
  | "Fakultas Ilmu Sosial, Hukum dan Ilmu Politik"
  | "Fakultas Matematika dan Ilmu Pengetahuan Alam"
  | "Fakultas Ekonomi dan Bisnis"
  | "Fakultas Teknik"
  | "Fakultas Ilmu Keolahragaan dan Kesehatan"
  | "Fakultas Bahasa, Seni dan Budaya"
  | "Fakultas Vokasi"
  | "Pascasarjana";

/** Status verifikasi dokumen */
export type VerificationStatus = "VALID" | "NOT_REGISTERED" | "INVALID";

/** Status dokumen */
export type DocumentStatus = "ACTIVE" | "REVOKED";

/** Record dokumen akademik sesuai MVP */
export type DocumentRecord = {
  id: number;
  title: string;
  documentType: DocumentType;
  ownerName: string;
  ownerIdentity: string; // NIM
  faculty: Faculty;
  studyProgram: string;
  documentYear: number;
  fileName: string;
  filePath: string;
  hashSHA256: string;
  cid?: string; // IPFS CID (bonus, opsional)
  institution: string; // Always "Universitas Negeri Yogyakarta"
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  transactionHash?: string; // Blockchain tx (bonus, opsional)
  explorerUrl?: string;
};

/** Record riwayat verifikasi */
export type VerificationRecord = {
  id: number;
  uploadedHash: string;
  status: VerificationStatus;
  documentId?: number;
  documentTitle?: string;
  documentOwner?: string;
  createdAt: string;
};

/** Data admin (tanpa passwordHash) */
export type AdminUser = {
  id: number;
  name: string;
  email: string;
};

/** Session payload yang di-encode ke JWT */
export type SessionPayload = {
  adminId: number;
  email: string;
  name: string;
};

/** Statistik dashboard */
export type DashboardStats = {
  totalDocuments: number;
  totalVerifications: number;
  validVerifications: number;
  invalidVerifications: number;
  notRegisteredVerifications: number;
};

// ============================================================
// Error Types
// ============================================================

export type AppErrorCategory =
  | "validation"
  | "ipfs"
  | "blockchain"
  | "not_found"
  | "auth"
  | "rate_limit"
  | "database"
  | "internal";

export type AppErrorPayload = {
  category: AppErrorCategory;
  message: string;
  details?: string;
};
