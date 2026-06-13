import { documentTypeList, facultyList } from "@/lib/constants";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

type Pagination = {
  page: number;
  limit: number;
  skip: number;
};

export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {}
): Pagination {
  const defaultLimit = options.defaultLimit ?? DEFAULT_PAGE_SIZE;
  const maxLimit = options.maxLimit ?? MAX_PAGE_SIZE;
  const pageRaw = Number.parseInt(searchParams.get("page") ?? "", 10);
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, maxLimit)
      : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function pickAllowedValue<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[]
): T | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return allowed.includes(trimmed as T) ? (trimmed as T) : undefined;
}

export function parseDocumentStatus(value: string | null | undefined) {
  return pickAllowedValue(value, ["ACTIVE", "REVOKED"] as const);
}

export function parseVerificationStatus(value: string | null | undefined) {
  return pickAllowedValue(value, [
    "VALID",
    "NOT_REGISTERED",
    "INVALID",
  ] as const);
}

export function parseDocumentType(value: string | null | undefined) {
  return pickAllowedValue(value, documentTypeList);
}

export function parseFaculty(value: string | null | undefined) {
  return pickAllowedValue(value, facultyList);
}

export function formatHashPreview(hash: string): string {
  if (hash.length <= 24) return hash;
  return `${hash.slice(0, 16)}...${hash.slice(-8)}`;
}

export function maskOwnerIdentity(identity: string): string {
  const normalized = identity.trim();
  if (normalized.length <= 4) return "****";
  return `${normalized.slice(0, 3)}${"*".repeat(
    Math.max(normalized.length - 5, 4)
  )}${normalized.slice(-2)}`;
}

export function maskPersonName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return part;
      return `${part[0]}${"*".repeat(Math.max(part.length - 1, 2))}`;
    })
    .join(" ");
}
