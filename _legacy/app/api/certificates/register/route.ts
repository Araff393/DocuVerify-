import { NextResponse } from "next/server";

import { registerCertificateOnChain } from "@/lib/blockchain";
import { AppError, toAppError } from "@/lib/errors";
import { uploadPdfToPinata } from "@/lib/pinata";
import { assertPdfFile, validateRegisterInput } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("validation", "File PDF wajib diunggah.", 400);
    }

    assertPdfFile(file);

    const input = validateRegisterInput({
      certificateId: formData.get("certificateId"),
      certificateName: formData.get("certificateName"),
      ownerName: formData.get("ownerName"),
      issuedDate: formData.get("issuedDate")
    });

    const { cid } = await uploadPdfToPinata(file, `${input.certificateId}-${file.name}`);
    const result = await registerCertificateOnChain(input, cid);

    return NextResponse.json(
      {
        message: "Sertifikat berhasil dicatat ke IPFS dan blockchain.",
        certificate: result.certificate
      },
      { status: 201 }
    );
  } catch (error) {
    const appError = toAppError(error);
    return NextResponse.json({ error: appError.toJSON() }, { status: appError.statusCode });
  }
}
