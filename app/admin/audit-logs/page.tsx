import Link from "next/link";
import type { Route } from "next";
import { Prisma } from "@prisma/client";

import { AdminLayout } from "@/components/admin-layout";
import { auditActionList, parseAuditAction } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { parsePagination } from "@/lib/query";

export const dynamic = "force-dynamic";

type SearchParams = {
  action?: string;
  page?: string;
  limit?: string;
};

const actionLabels: Record<string, string> = {
  DOCUMENT_CREATED: "Dokumen Dibuat",
  DOCUMENT_REVOKED: "Dokumen Dicabut",
  PASSWORD_CHANGED: "Password Diubah",
  LOGOUT: "Logout",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) queryParams.set(key, value);
  }

  const action = parseAuditAction(params.action);
  const pagination = parsePagination(queryParams);
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (action) where.action = action;

  const [auditLogs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const startItem = total === 0 ? 0 : pagination.skip + 1;
  const endItem = Math.min(pagination.skip + auditLogs.length, total);
  const buildPageHref = (page: number) => {
    const nextParams = new URLSearchParams(queryParams);
    nextParams.set("page", String(page));
    nextParams.set("limit", String(pagination.limit));
    return `/admin/audit-logs?${nextParams.toString()}` as Route;
  };

  return (
    <AdminLayout
      title="Audit Log"
      subtitle="Jejak aksi penting administrator dalam sistem DocuVerify."
    >
      <form
        method="get"
        className="bg-surface-container-low p-4 flex flex-wrap items-center gap-3 rounded-xl mb-6 border border-outline-variant/10"
      >
        <select
          name="action"
          defaultValue={action ?? ""}
          className="form-select bg-surface-container-highest text-white text-xs py-3 px-4 rounded-lg border-outline-variant/20 min-w-[220px]"
        >
          <option value="">Semua Aksi</option>
          {auditActionList.map((item) => (
            <option key={item} value={item}>
              {actionLabels[item] ?? item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#8ff5ff]/10 text-[#8ff5ff] border border-[#8ff5ff]/30 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#8ff5ff]/20 transition-colors"
        >
          Filter
        </button>
        {action && (
          <Link
            href={"/admin/audit-logs" as Route}
            className="text-slate-400 hover:text-white text-xs uppercase tracking-wider px-3 py-3"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
        <div className="overflow-x-auto w-full scrollbar-hide">
          <table className="admin-table min-w-[1000px]">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Waktu</th>
                <th>Aksi</th>
                <th>Admin</th>
                <th>Target</th>
                <th>IP Address</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-sm">
                    Belum ada audit log yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, index) => (
                  <tr key={log.id}>
                    <td className="text-slate-500 font-mono text-xs">
                      {pagination.skip + index + 1}
                    </td>
                    <td>
                      <span className="text-sm text-white whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-[#8ff5ff] bg-[#8ff5ff]/10 px-2 py-1 rounded">
                        {actionLabels[log.action] ?? log.action}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-white block">{log.admin.name}</span>
                      <span className="text-[10px] text-slate-500">{log.admin.email}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-400 font-mono">
                        {log.targetType ?? "-"} {log.targetId ? `#${log.targetId}` : ""}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 font-mono">
                        {log.ipAddress ?? "-"}
                      </span>
                    </td>
                    <td>
                      <code className="block max-w-[320px] truncate text-[11px] text-slate-500 font-mono">
                        {log.metadata ?? "-"}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-outline-variant/10 gap-4">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {startItem}-{endItem} dari {total} audit log
          </span>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                href={buildPageHref(pagination.page - 1)}
                className="px-3 py-2 text-xs text-slate-300 border border-outline-variant/20 rounded-lg hover:bg-surface-container-highest"
              >
                Sebelumnya
              </Link>
            ) : (
              <span className="px-3 py-2 text-xs text-slate-600 border border-outline-variant/10 rounded-lg">
                Sebelumnya
              </span>
            )}
            <span className="text-xs text-slate-500">
              Halaman {pagination.page} / {totalPages}
            </span>
            {pagination.page < totalPages ? (
              <Link
                href={buildPageHref(pagination.page + 1)}
                className="px-3 py-2 text-xs text-slate-300 border border-outline-variant/20 rounded-lg hover:bg-surface-container-highest"
              >
                Berikutnya
              </Link>
            ) : (
              <span className="px-3 py-2 text-xs text-slate-600 border border-outline-variant/10 rounded-lg">
                Berikutnya
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
