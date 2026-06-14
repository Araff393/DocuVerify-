import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminLayout } from "@/components/admin-layout";
import { prisma } from "@/lib/db";
import { getPublicVerificationUrl } from "@/lib/public-document";
import { DocumentActions } from "./document-actions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function AdminDocumentDetailPage({ params }: Params) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const doc = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      documentType: true,
      ownerName: true,
      ownerIdentity: true,
      faculty: true,
      studyProgram: true,
      documentYear: true,
      institution: true,
      fileName: true,
      publicCode: true,
      hashSHA256: true,
      ipfsCid: true,
      status: true,
      createdAt: true,
      verifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          uploadedHash: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!doc) {
    return (
      <AdminLayout title="Dokumen Tidak Ditemukan">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">
            search_off
          </span>
          <h2 className="font-headline text-2xl text-white mb-2">
            Dokumen tidak ditemukan
          </h2>
          <p className="text-slate-400 mb-8">
            Dokumen dengan ID #{idStr} tidak ada dalam sistem.
          </p>
          <Link
            href="/admin/documents"
            className="bg-[#8ff5ff] text-[#080e1c] px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#b3faff] transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Daftar
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const metadataItems = [
    { label: "Judul Dokumen", value: doc.title, icon: "title", span: true },
    { label: "Jenis Dokumen", value: doc.documentType, icon: "category" },
    { label: "Nama Pemilik", value: doc.ownerName, icon: "person" },
    { label: "NIM", value: doc.ownerIdentity, icon: "badge" },
    { label: "Fakultas", value: doc.faculty, icon: "school" },
    { label: "Program Studi", value: doc.studyProgram, icon: "menu_book" },
    {
      label: "Tahun Dokumen",
      value: doc.documentYear.toString(),
      icon: "calendar_today",
    },
    { label: "Institusi", value: doc.institution, icon: "account_balance" },
    { label: "Nama File", value: doc.fileName, icon: "attach_file" },
    {
      label: "Tanggal Didaftarkan",
      value: new Date(doc.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: "schedule",
    },
  ];

  const qrContent = getPublicVerificationUrl(doc.publicCode);

  return (
    <AdminLayout
      title={`Detail Dokumen #${doc.id}`}
      subtitle={doc.title}
      actions={
        <Link
          href="/admin/documents"
          className="border border-[#424858]/30 text-slate-300 px-5 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali
        </Link>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-xl flex items-center gap-4 ${
              doc.status === "ACTIVE"
                ? "bg-secondary/5 border border-secondary/20"
                : "bg-error/5 border border-error/20"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                doc.status === "ACTIVE" ? "bg-secondary/10" : "bg-error/10"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  doc.status === "ACTIVE" ? "text-secondary" : "text-error"
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {doc.status === "ACTIVE" ? "verified" : "block"}
              </span>
            </div>
            <div>
              <p className="text-white font-headline font-bold">
                Status: {doc.status === "ACTIVE" ? "Aktif" : "Dicabut"}
              </p>
              <p className="text-xs text-slate-400">
                Dokumen ini{" "}
                {doc.status === "ACTIVE"
                  ? "valid dan terdaftar dalam sistem"
                  : "telah dicabut dan verifikasi publik akan menghasilkan status INVALID"}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <h3 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff]">info</span>
              Metadata Dokumen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metadataItems.map((item) => (
                <div
                  key={item.label}
                  className={`bg-surface-container-highest/50 p-4 rounded-lg border-l-4 border-[#8ff5ff]/30 ${
                    item.span ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">
                      {item.icon}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-white font-medium text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verifikasi terbaru */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <h3 className="font-headline text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff]">history</span>
              Verifikasi Terbaru
            </h3>
            {doc.verifications.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Belum ada percobaan verifikasi untuk dokumen ini.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/10">
                {doc.verifications.map((v) => (
                  <li
                    key={v.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`badge text-[9px] ${
                          v.status === "VALID"
                            ? "badge-valid"
                            : v.status === "INVALID"
                            ? "badge-invalid"
                            : "badge-not-registered"
                        }`}
                      >
                        {v.status === "VALID"
                          ? "Valid"
                          : v.status === "INVALID"
                          ? "Tidak Valid"
                          : "Tidak Terdaftar"}
                      </span>
                      <code className="text-[11px] text-slate-400 font-mono">
                        {v.uploadedHash.slice(0, 16)}...{v.uploadedHash.slice(-8)}
                      </code>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar — Client component for interactive parts */}
        <DocumentActions
          documentId={doc.id}
          qrContent={qrContent}
          fileName={doc.fileName}
          publicCode={doc.publicCode}
          hashSHA256={doc.hashSHA256}
          ipfsCid={doc.ipfsCid}
          status={doc.status}
        />
      </div>
    </AdminLayout>
  );
}
