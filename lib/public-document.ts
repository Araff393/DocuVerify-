import crypto from "crypto";

type PublicDocument = {
  id: number;
  title: string;
  documentType: string;
  ownerName: string;
  ownerIdentity: string;
  faculty: string;
  studyProgram: string;
  documentYear: number;
  institution: string;
  publicCode: string;
  hashSHA256: string;
  ipfsCid: string | null;
  status: string;
  createdAt: Date;
};

export type PublicVerificationStatus =
  | "REGISTERED"
  | "VALID"
  | "INVALID"
  | "NOT_REGISTERED"
  | "REVOKED";

export function generatePublicCode(documentYear: number): string {
  const random = crypto
    .randomBytes(4)
    .toString("base64url")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6)
    .padEnd(6, "0");

  return `DOC-UNY-${documentYear}-${random}`;
}

export function isDocuVerifyPublicCode(value: string | null | undefined) {
  return /^DOC-UNY-\d{4}-[A-Z0-9]{6}$/.test(value ?? "");
}

export function getAppBaseUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }

  if (process.env.VERCEL_URL) {
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    return `https://${productionUrl || process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getPublicVerificationUrl(publicCode: string, requestUrl?: string) {
  return `${getAppBaseUrl(requestUrl)}/v/${encodeURIComponent(publicCode)}`;
}

export function toPublicDocument(document: PublicDocument) {
  return {
    id: document.id,
    title: document.title,
    documentType: document.documentType,
    ownerName: document.ownerName,
    ownerIdentity: document.ownerIdentity,
    faculty: document.faculty,
    studyProgram: document.studyProgram,
    documentYear: document.documentYear,
    institution: document.institution,
    publicCode: document.publicCode,
    hashSHA256: document.hashSHA256,
    ipfsCid: document.ipfsCid,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
  };
}
