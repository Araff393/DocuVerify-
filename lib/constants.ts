import type { DocumentType, Faculty } from "@/lib/types";

/** Jenis dokumen yang dapat didaftarkan */
export const documentTypeList: readonly DocumentType[] = [
  "Sertifikat Akademik",
  "Sertifikat Lainnya",
] as const;

/** Fakultas UNY */
export const facultyList: readonly Faculty[] = [
  "Fakultas Ilmu Pendidikan dan Psikologi",
  "Fakultas Ilmu Sosial, Hukum dan Ilmu Politik",
  "Fakultas Matematika dan Ilmu Pengetahuan Alam",
  "Fakultas Ekonomi dan Bisnis",
  "Fakultas Teknik",
  "Fakultas Ilmu Keolahragaan dan Kesehatan",
  "Fakultas Bahasa, Seni dan Budaya",
  "Fakultas Vokasi",
  "Pascasarjana",
] as const;

/** Batas upload file */
export const FILE_MAX_MB = 10;
export const FILE_MAX_BYTES = FILE_MAX_MB * 1024 * 1024;

/** Nama cookie session admin */
export const SESSION_COOKIE_NAME = "docuverify_session";

/** Umur session (7 hari) */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
