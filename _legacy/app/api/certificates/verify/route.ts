import { NextResponse } from "next/server";

import { getCertificateById, getCertificateCid } from "@/lib/blockchain";
import { AppError, toAppError } from "@/lib/errors";
import { uploadPdfToPinata } from "@/lib/pinata";
import { assertPdfFile, validateVerifyInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("validation", "File PDF wajib diunggah.", 400);
    }

    assertPdfFile(file);

    const { certificateId } = validateVerifyInput({
      certificateId: formData.get("certificateId")
    });

    const [uploadResult, referenceCid, certificate] = await Promise.all([
      uploadPdfToPinata(file, `verify-${certificateId}-${file.name}`),
      getCertificateCid(certificateId),
      getCertificateById(certificateId)
    ]);

    const currentCid = uploadResult.cid;
    const isValid = currentCid === referenceCid;

    return NextResponse.json({
      certificateId,
      currentCid,
      referenceCid,
      isValid,
      status: isValid ? "Valid" : "Invalid",
      message: isValid
        ? "Dokumen identik dengan sertifikat yang tercatat."
        : "CID berbeda. Dokumen telah berubah dari versi yang terdaftar.",
      certificate
    });
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json({ error: appError.toJSON() }, { status: appError.statusCode });
  }
}
