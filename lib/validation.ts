import { z } from "zod";

import { documentTypeList, facultyList } from "@/lib/constants";

// ============================================================
// Schema: pendaftaran dokumen akademik (MVP)
// ============================================================

export const registerDocumentSchema = z.object({
  title: z.string().trim().min(1, "Judul dokumen wajib diisi.").max(300),
  documentType: z.enum(documentTypeList as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Jenis dokumen tidak valid." }),
  }),
  ownerName: z.string().trim().min(1, "Nama pemilik wajib diisi.").max(200),
  ownerIdentity: z.string().trim().min(1, "NIM wajib diisi.").max(50),
  faculty: z.enum(facultyList as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Fakultas tidak valid." }),
  }),
  studyProgram: z.string().trim().min(1, "Program studi wajib diisi.").max(200),
  documentYear: z.coerce
    .number({ invalid_type_error: "Tahun harus berupa angka." })
    .int("Tahun harus bilangan bulat.")
    .min(2000, "Tahun minimal 2000.")
    .max(2099, "Tahun maksimal 2099."),
});

export type RegisterDocumentInput = z.infer<typeof registerDocumentSchema>;

export function validateRegisterDocumentInput(
  input: Record<string, unknown>
): RegisterDocumentInput {
  return registerDocumentSchema.parse(input);
}

// ============================================================
// Schema: login admin
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================
// Schema: ubah password admin
// ============================================================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi."),
    newPassword: z
      .string()
      .min(12, "Password baru minimal 12 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok.",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
