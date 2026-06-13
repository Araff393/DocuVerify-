import Link from "next/link";

import { Navigation } from "@/components/navigation";
import { prisma } from "@/lib/db";
import { formatHashPreview } from "@/lib/query";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  // Riwayat publik — tanpa IP address, max 50 terbaru
  const verifications = await prisma.verificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      uploadedHash: true,
      status: true,
      createdAt: true,
      documentId: true,
    },
  });

  const totalCount = await prisma.verificationLog.count();

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
    <div className="bg-[#080e1c] text-[#f8fafc] min-h-screen selection:bg-[#8ff5ff]/30 selection:text-[#8ff5ff]">
      <Navigation />

      <main className="pt-28 pb-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 rounded-full mb-6">
              <span
                className="material-symbols-outlined text-[#8ff5ff] text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                history
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8ff5ff] font-bold">
                Riwayat Verifikasi Publik
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif-accent text-white tracking-tight glow-text mb-4">
              Catatan Verifikasi Dokumen
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Daftar 50 percobaan verifikasi terbaru di sistem DocuVerify UNY.
              Total <span className="text-[#8ff5ff] font-bold">{totalCount}</span> verifikasi telah tercatat sejak sistem aktif.
            </p>
          </header>

          {/* Table */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
            <div className="overflow-x-auto w-full scrollbar-hide">
              <table className="admin-table min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Tanggal</th>
                    <th>Hash Diverifikasi</th>
                    <th>Status</th>
                    <th>Dokumen Terkait</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-16 text-slate-500"
                      >
                        <span className="material-symbols-outlined text-5xl text-slate-700 mb-3 block">
                          inbox
                        </span>
                        <p className="text-sm">
                          Belum ada riwayat verifikasi. Silakan{" "}
                          <Link
                            href="/verify"
                            className="text-[#8ff5ff] hover:underline"
                          >
                            verifikasi dokumen pertama
                          </Link>
                          .
                        </p>
                      </td>
                    </tr>
                  ) : (
                    verifications.map((ver, index) => (
                      <tr key={ver.id}>
                        <td className="text-slate-500 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td>
                          <span className="text-sm text-white whitespace-nowrap">
                            {new Date(ver.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {new Date(ver.createdAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </td>
                        <td>
                          <code className="text-[11px] text-slate-400 font-mono">
                            {formatHashPreview(ver.uploadedHash)}
                          </code>
                        </td>
                        <td>
                          <span
                            className={`badge text-[9px] ${statusBadge(
                              ver.status
                            )}`}
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
                          {ver.documentId ? (
                            <div>
                              <span className="text-sm text-white block max-w-[260px] truncate">
                                Dokumen terdaftar
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Metadata detail hanya tersedia untuk admin
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">
                              Tidak terdaftar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {verifications.length} riwayat terbaru dari total{" "}
                {totalCount}
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="mt-8 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
            <h3 className="font-headline text-sm font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff] text-sm">
                info
              </span>
              Tentang Riwayat Ini
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-body">
              Halaman ini menampilkan log verifikasi publik untuk transparansi.
              IP address pemohon tidak ditampilkan kepada publik dan hanya
              tersedia di panel admin untuk keperluan audit. Hash yang
              ditampilkan adalah sidik jari digital dari file PDF yang diunggah
              user — bukan isi dokumen itu sendiri.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-[#080e1c] border-t border-[#424858]/15">
        <div className="text-center font-headline text-[10px] uppercase tracking-[0.3em] text-[#e3e7fc]/40">
          © {new Date().getFullYear()} DocuVerify UNY • Universitas Negeri
          Yogyakarta
        </div>
      </footer>
    </div>
  );
}
