import "server-only";

import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export const auditActionList = [
  "DOCUMENT_CREATED",
  "DOCUMENT_REVOKED",
  "PASSWORD_CHANGED",
  "LOGOUT",
] as const;

export type AuditAction = (typeof auditActionList)[number];

type WriteAuditLogInput = {
  adminId: number;
  action: AuditAction;
  request?: Request;
  targetType?: string;
  targetId?: string | number;
  metadata?: Record<string, unknown>;
};

export function parseAuditAction(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return auditActionList.includes(trimmed as AuditAction)
    ? (trimmed as AuditAction)
    : undefined;
}

export async function writeAuditLog({
  adminId,
  action,
  request,
  targetType,
  targetId,
  metadata,
}: WriteAuditLogInput) {
  return prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType: targetType ?? null,
      targetId: targetId === undefined ? null : String(targetId),
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress: request ? getClientIp(request) : null,
    },
  });
}
