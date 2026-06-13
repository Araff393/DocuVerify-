import Link from "next/link";
import type { Route } from "next";
import { Prisma } from "@prisma/client";

import { AdminLayout } from "@/components/admin-layout";
import { prisma } from "@/lib/db";
import { parsePagination, parseVerificationStatus } from "@/lib/query";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
};

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) queryParams.set(key, value);
  }

  const statusFilter = parseVerificationStatus(params.status);
  const search = params.search?.trim().slice(0, 100);
  const pagination = parsePagination(queryParams);

  const where: Prisma.VerificationLogWhereInput = {};
  if (statusFilter) where.status = statusFilter;
  if (search) {
    where.OR = [
      { uploadedHash: { contains: search } },
      { document: { is: { title: { contains: search } } } },
      { document: { is: { ownerName: { contains: search } } } },
    ];
  }

  const [verifications, filteredTotal, validCount, notRegCount, invalidCount] =
    await Promise.all([
      prisma.verificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              ownerName: true,
              ownerIdentity: true,
            },
          },
        },
      }),
      prisma.verificationLog.count({ where }),
      prisma.verificationLog.count({ where: { status: "VALID" } }),
      prisma.verificationLog.count({ where: { status: "NOT_REGISTERED" } }),
      prisma.verificationLog.count({ where: { status: "INVALID" } }),
    ]);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pagination.limit));
  const startItem = filteredTotal === 0 ? 0 : pagination.skip + 1;
  const endItem = Math.min(pagination.skip + verifications.length, filteredTotal);
  const buildPageHref = (page: number) => {
    const nextParams = new URLSearchParams(queryParams);
    nextParams.set("page", String(page));
    nextParams.set("limit", String(pagination.limit));
    return `/admin/verifications?${nextParams.toString()}` as Route;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "VALID":
        return "Valid";
      case "NOT_REGISTERED":
        return "Tidak Terdaftar";
      case "INVALID":
        return "Tidak Valid";
      default:
        return status;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return "badge-valid";
      case "NOT_REGISTERED":
        return "badge-not-registered";
      case "INVALID":
        return "badge-invalid";
      default:
        return "";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "VALID":
        return "check_circle";
      case "NOT_REGISTERED":
        return "help";
      case "INVALID":
        return "cancel";
      default:
        return "circle";
    }
  };

  return (
    <AdminLayout
      title="Riwayat Verifikasi"
      subtitle="Catatan semua percobaan verifikasi dokumen oleh publik."
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-secondary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div>
            <p className="text-2xl font-headline font-bold text-secondary">
              {validCount}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Verifikasi Valid
            </p>
          </div>
        </div>
        <div className="bg-[#ffb400]/5 border border-[#ffb400]/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#ffb400]/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[#ffb400] text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              help
            </span>
          </div>
          <div>
            <p className="text-2xl font-headline font-bold text-[#ffb400]">
              {notRegCount}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Tidak Terdaftar
            </p>
          </div>
        </div>
        <div className="bg-error/5 border border-error/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-error text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cancel
            </span>
          </div>
          <div>
            <p className="text-2xl font-headline font-bold text-error">
              {invalidCount}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Tidak Valid
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        method="get"
        className="bg-surface-container-low p-4 flex flex-wrap items-center justify-between gap-4 rounded-xl mb-6 border border-outline-variant/10"
      >
        <div className="flex-1 min-w-[280px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input
            name="search"
            defaultValue={search ?? ""}
            className="w-full bg-surface-container-highest border border-outline-variant/20 text-white text-sm py-3 pl-12 pr-4 focus:ring-1 focus:ring-[#8ff5ff]/40 rounded-lg placeholder:text-slate-500 transition-shadow outline-none"
            placeholder="Cari berdasarkan hash, judul, atau nama pemilik..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="form-select bg-surface-container-highest text-white text-xs py-3 px-4 rounded-lg border-outline-variant/20 min-w-[160px]"
          >
            <option value="">Semua Status</option>
            <option value="VALID">Valid</option>
            <option value="NOT_REGISTERED">Tidak Terdaftar</option>
            <option value="INVALID">Tidak Valid</option>
          </select>
          <button
            type="submit"
            className="bg-[#8ff5ff]/10 text-[#8ff5ff] border border-[#8ff5ff]/30 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#8ff5ff]/20 transition-colors"
          >
            Filter
          </button>
          {(statusFilter || search) && (
            <Link
              href="/admin/verifications"
              className="text-slate-400 hover:text-white text-xs uppercase tracking-wider px-3 py-3"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Verifications Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
        <div className="overflow-x-auto w-full scrollbar-hide">
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Tanggal</th>
                <th>Hash yang Diuji</th>
                <th>Status</th>
                <th>Dokumen Terkait</th>
                <th>Pemilik</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {verifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-500 text-sm"
                  >
                    Belum ada riwayat verifikasi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                verifications.map((ver, index) => (
                  <tr key={ver.id}>
                    <td className="text-slate-500 font-mono text-xs">
                      {pagination.skip + index + 1}
                    </td>
                    <td>
                      <span className="text-sm text-white whitespace-nowrap">
                        {new Date(ver.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(ver.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td>
                      <code className="text-[11px] text-slate-400 font-mono">
                        {ver.uploadedHash.slice(0, 16)}...
                        {ver.uploadedHash.slice(-8)}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`badge text-[9px] ${statusBadge(ver.status)}`}
                      >
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {statusIcon(ver.status)}
                        </span>
                        {statusLabel(ver.status)}
                      </span>
                    </td>
                    <td>
                      {ver.document ? (
                        <Link
                          href={`/admin/documents/${ver.document.id}`}
                          className="text-sm text-white hover:text-[#8ff5ff] block max-w-[250px] truncate"
                        >
                          {ver.document.title}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-600 italic">
                          Tidak ditemukan
                        </span>
                      )}
                    </td>
                    <td>
                      {ver.document ? (
                        <span className="text-sm text-slate-300">
                          {ver.document.ownerName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 font-mono">
                        {ver.ipAddress ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-outline-variant/10 gap-4">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {startItem}-{endItem} dari {filteredTotal} riwayat
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
