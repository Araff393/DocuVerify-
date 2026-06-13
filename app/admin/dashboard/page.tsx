import Link from "next/link";

import { AdminLayout } from "@/components/admin-layout";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Query Prisma langsung (Server Component)
  const [
    totalDocuments,
    totalVerifications,
    validVerifications,
    notRegisteredVerifications,
    recentDocs,
    recentVer,
  ] = await Promise.all([
    prisma.document.count(),
    prisma.verificationLog.count(),
    prisma.verificationLog.count({ where: { status: "VALID" } }),
    prisma.verificationLog.count({ where: { status: "NOT_REGISTERED" } }),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.verificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        document: { select: { title: true, ownerName: true } },
      },
    }),
  ]);

  const statCards = [
    {
      label: "Total Dokumen",
      value: totalDocuments,
      icon: "folder_open",
      color: "text-[#8ff5ff]",
      bgColor: "bg-[#8ff5ff]/10",
      borderColor: "border-[#8ff5ff]/20",
    },
    {
      label: "Total Verifikasi",
      value: totalVerifications,
      icon: "verified_user",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/20",
    },
    {
      label: "Verifikasi Valid",
      value: validVerifications,
      icon: "check_circle",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/20",
    },
    {
      label: "Tidak Terdaftar",
      value: notRegisteredVerifications,
      icon: "help_outline",
      color: "text-[#ffb400]",
      bgColor: "bg-[#ffb400]/10",
      borderColor: "border-[#ffb400]/20",
    },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Ringkasan data dokumen dan verifikasi akademik."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card animate-fade-in-up animate-fade-in-up-delay-${i + 1}`}
          >
            <div className={`stat-icon ${card.bgColor} border ${card.borderColor}`}>
              <span
                className={`material-symbols-outlined ${card.color} text-xl`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {card.icon}
              </span>
            </div>
            <div className={`stat-value ${card.color}`}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Two Column: Recent Documents & Recent Verifications */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
            <h2 className="font-headline text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff] text-xl">description</span>
              Dokumen Terbaru
            </h2>
            <Link
              href="/admin/documents"
              className="text-xs text-[#8ff5ff] hover:text-[#b3faff] transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
            >
              Lihat Semua
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/5">
            {recentDocs.length === 0 && (
              <p className="px-6 py-8 text-sm text-slate-500 text-center">
                Belum ada dokumen terdaftar.
              </p>
            )}
            {recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/admin/documents/${doc.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-highest/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#8ff5ff]/10 border border-[#8ff5ff]/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#8ff5ff] text-lg">
                    description
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-[#8ff5ff] transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {doc.ownerName} • {doc.faculty}
                  </p>
                </div>
                <span className="badge badge-active text-[9px] shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${doc.status === "ACTIVE" ? "bg-secondary" : "bg-error"}`} />
                  {doc.status === "ACTIVE" ? "Aktif" : "Dicabut"}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Verifications */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
            <h2 className="font-headline text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-xl">history</span>
              Verifikasi Terbaru
            </h2>
            <Link
              href="/admin/verifications"
              className="text-xs text-[#8ff5ff] hover:text-[#b3faff] transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
            >
              Lihat Semua
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="divide-y divide-outline-variant/5">
            {recentVer.length === 0 && (
              <p className="px-6 py-8 text-sm text-slate-500 text-center">
                Belum ada riwayat verifikasi.
              </p>
            )}
            {recentVer.map((ver) => (
              <div
                key={ver.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-highest/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  ver.status === "VALID"
                    ? "bg-secondary/10 border border-secondary/20"
                    : ver.status === "NOT_REGISTERED"
                    ? "bg-[#ffb400]/10 border border-[#ffb400]/20"
                    : "bg-error/10 border border-error/20"
                }`}>
                  <span
                    className={`material-symbols-outlined text-lg ${
                      ver.status === "VALID"
                        ? "text-secondary"
                        : ver.status === "NOT_REGISTERED"
                        ? "text-[#ffb400]"
                        : "text-error"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {ver.status === "VALID"
                      ? "check_circle"
                      : ver.status === "NOT_REGISTERED"
                      ? "help"
                      : "cancel"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {ver.document?.title ?? "Dokumen tidak ditemukan"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(ver.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`badge text-[9px] shrink-0 ${
                  ver.status === "VALID"
                    ? "badge-valid"
                    : ver.status === "NOT_REGISTERED"
                    ? "badge-not-registered"
                    : "badge-invalid"
                }`}>
                  {ver.status === "VALID"
                    ? "Valid"
                    : ver.status === "NOT_REGISTERED"
                    ? "Tidak Terdaftar"
                    : "Tidak Valid"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
