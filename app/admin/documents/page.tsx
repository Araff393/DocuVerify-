import Link from "next/link";
import type { Route } from "next";
import { Prisma } from "@prisma/client";

import { AdminLayout } from "@/components/admin-layout";
import { prisma } from "@/lib/db";
import { documentTypeList, facultyList } from "@/lib/constants";
import {
  parseDocumentStatus,
  parseDocumentType,
  parseFaculty,
  parsePagination,
} from "@/lib/query";

export const dynamic = "force-dynamic";

type SearchParams = {
  search?: string;
  documentType?: string;
  faculty?: string;
  status?: string;
  page?: string;
  limit?: string;
};

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) queryParams.set(key, value);
  }

  const search = params.search?.trim().slice(0, 100);
  const documentType = parseDocumentType(params.documentType);
  const faculty = parseFaculty(params.faculty);
  const status = parseDocumentStatus(params.status);
  const pagination = parsePagination(queryParams);

  // Build Prisma `where` clause
  const where: Prisma.DocumentWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { ownerName: { contains: search } },
      { ownerIdentity: { contains: search } },
      { hashSHA256: { contains: search } },
    ];
  }
  if (documentType) where.documentType = documentType;
  if (faculty) where.faculty = faculty;
  if (status) where.status = status;

  const [documents, totalDocuments] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        title: true,
        documentType: true,
        ownerName: true,
        ownerIdentity: true,
        faculty: true,
        documentYear: true,
        status: true,
      },
    }),
    prisma.document.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalDocuments / pagination.limit));
  const startItem = totalDocuments === 0 ? 0 : pagination.skip + 1;
  const endItem = Math.min(pagination.skip + documents.length, totalDocuments);
  const buildPageHref = (page: number) => {
    const nextParams = new URLSearchParams(queryParams);
    nextParams.set("page", String(page));
    nextParams.set("limit", String(pagination.limit));
    return `/admin/documents?${nextParams.toString()}` as Route;
  };

  return (
    <AdminLayout
      title="Daftar Dokumen"
      subtitle="Semua dokumen akademik yang terdaftar dalam sistem."
      actions={
        <Link
          href="/admin/documents/create"
          className="min-h-11 w-full justify-center sm:w-auto bg-[#8ff5ff] text-[#080e1c] px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#b3faff] active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(143,245,255,0.2)]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Dokumen Baru
        </Link>
      }
    >
      {/* Controls Bar — pakai form GET supaya filter pakai querystring */}
      <form
        method="get"
        className="bg-surface-container-low p-4 flex flex-wrap items-center justify-between gap-4 rounded-xl mb-6 border border-outline-variant/10"
      >
        {/* Search */}
        <div className="w-full flex-1 min-w-0 sm:min-w-[280px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input
            name="search"
            defaultValue={search ?? ""}
            className="w-full bg-surface-container-highest border border-outline-variant/20 text-white text-sm py-3 pl-12 pr-4 focus:ring-1 focus:ring-[#8ff5ff]/40 rounded-lg placeholder:text-slate-500 transition-shadow outline-none"
            placeholder="Cari berdasarkan judul, nama, NIM, atau hash..."
            type="text"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full items-center gap-3 flex-wrap lg:w-auto">
          <select
            name="documentType"
            defaultValue={documentType ?? ""}
            className="form-select w-full sm:w-auto bg-surface-container-highest text-white text-xs py-3 px-4 rounded-lg border-outline-variant/20 min-w-0 sm:min-w-[160px]"
          >
            <option value="">Semua Jenis</option>
            {documentTypeList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            name="faculty"
            defaultValue={faculty ?? ""}
            className="form-select w-full sm:w-auto bg-surface-container-highest text-white text-xs py-3 px-4 rounded-lg border-outline-variant/20 min-w-0 sm:min-w-[200px]"
          >
            <option value="">Semua Fakultas</option>
            {facultyList.map((fac) => (
              <option key={fac} value={fac}>
                {fac}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status ?? ""}
            className="form-select w-full sm:w-auto bg-surface-container-highest text-white text-xs py-3 px-4 rounded-lg border-outline-variant/20 min-w-0 sm:min-w-[140px]"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="REVOKED">Dicabut</option>
          </select>

          <button
            type="submit"
            className="min-h-11 w-full sm:w-auto bg-[#8ff5ff]/10 text-[#8ff5ff] border border-[#8ff5ff]/30 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#8ff5ff]/20 transition-colors"
          >
            Filter
          </button>
          {(search || documentType || faculty || status) && (
            <Link
              href="/admin/documents"
              className="text-slate-400 hover:text-white text-xs uppercase tracking-wider px-3 py-3"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Documents Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
        <div className="overflow-x-auto w-full scrollbar-hide">
          <table className="admin-table min-w-[1100px]">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Judul Dokumen</th>
                <th>Jenis</th>
                <th>Pemilik</th>
                <th>NIM</th>
                <th>Fakultas</th>
                <th>Tahun</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 text-sm">
                    Tidak ada dokumen yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                documents.map((doc, index) => (
                  <tr key={doc.id}>
                    <td className="text-slate-500 font-mono text-xs">
                      {pagination.skip + index + 1}
                    </td>
                    <td>
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="text-white hover:text-[#8ff5ff] transition-colors font-medium text-sm block max-w-[280px] truncate"
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td>
                      <span className="text-xs text-slate-400 bg-surface-container-highest px-2 py-1 rounded">
                        {doc.documentType}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#8ff5ff]/10 flex items-center justify-center text-[10px] text-[#8ff5ff] font-bold shrink-0">
                          {doc.ownerName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm text-white whitespace-nowrap">{doc.ownerName}</span>
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-slate-400 font-mono">{doc.ownerIdentity}</code>
                    </td>
                    <td>
                      <span
                        className="text-xs text-slate-400 max-w-[150px] truncate block"
                        title={doc.faculty}
                      >
                        {doc.faculty.replace("Fakultas ", "F. ")}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-300 font-mono">{doc.documentYear}</span>
                    </td>
                    <td>
                      <span
                        className={`badge text-[9px] ${
                          doc.status === "ACTIVE" ? "badge-active" : "badge-revoked"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doc.status === "ACTIVE" ? "bg-secondary" : "bg-error"
                          }`}
                        />
                        {doc.status === "ACTIVE" ? "Aktif" : "Dicabut"}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 text-[#8ff5ff] hover:text-[#b3faff] transition-colors text-xs font-bold uppercase tracking-wider"
                      >
                        Detail
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-outline-variant/10 gap-4">
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {startItem}-{endItem} dari {totalDocuments} dokumen
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
