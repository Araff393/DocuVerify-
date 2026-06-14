import Link from "next/link";
import { unstable_cache } from "next/cache";

import { Navigation } from "@/components/navigation";
import { prisma } from "@/lib/db";
import { formatHashPreview, maskOwnerIdentity, maskPersonName } from "@/lib/query";
import { QrVerifyForm } from "./qr-verify-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ publicCode: string }> };

const getPublicDocumentByCode = unstable_cache(
  async (publicCode: string) =>
    prisma.document.findUnique({
      where: { publicCode },
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
        publicCode: true,
        hashSHA256: true,
        ipfsCid: true,
        status: true,
        createdAt: true,
      },
    }),
  ["public-document-by-code"],
  { revalidate: 15 }
);

function StatusPanel({ status }: { status: "REGISTERED" | "NOT_REGISTERED" | "REVOKED" }) {
  const config = {
    REGISTERED: {
      icon: "verified",
      label: "REGISTERED",
      title: "Dokumen Terdaftar",
      message: "Kode QR ini terhubung dengan dokumen resmi di DocuVerify.",
      className: "border-secondary/30 bg-secondary/10 text-secondary",
    },
    NOT_REGISTERED: {
      icon: "help_outline",
      label: "NOT_REGISTERED",
      title: "Kode Tidak Terdaftar",
      message: "Kode QR tidak dikenali oleh sistem DocuVerify.",
      className: "border-[#ffb400]/30 bg-[#ffb400]/10 text-[#ffb400]",
    },
    REVOKED: {
      icon: "block",
      label: "REVOKED",
      title: "Dokumen Dicabut",
      message: "Dokumen ditemukan, tetapi statusnya sudah dicabut.",
      className: "border-error/30 bg-error/10 text-error",
    },
  }[status];

  return (
    <div className={`border p-5 sm:p-6 md:p-8 ${config.className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="w-16 h-16 bg-[#080e1c]/50 flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
            {config.label}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl text-white mt-1 mb-2 break-words">
            {config.title}
          </h1>
          <p className="text-slate-300">{config.message}</p>
        </div>
      </div>
    </div>
  );
}

export default async function PublicDocumentVerificationPage({ params }: Params) {
  const { publicCode } = await params;
  const document = await getPublicDocumentByCode(publicCode);

  const pageStatus = !document
    ? "NOT_REGISTERED"
    : document.status === "REVOKED"
    ? "REVOKED"
    : "REGISTERED";

  const metadataItems = document
    ? [
        { label: "Judul Dokumen", value: document.title, span: true },
        { label: "Jenis Dokumen", value: document.documentType },
        { label: "Nama Pemilik", value: maskPersonName(document.ownerName) },
        { label: "NIM / Identitas", value: maskOwnerIdentity(document.ownerIdentity) },
        { label: "Fakultas", value: document.faculty },
        { label: "Program Studi", value: document.studyProgram },
        { label: "Tahun", value: document.documentYear.toString() },
        { label: "Institusi", value: document.institution },
        { label: "Kode Dokumen", value: document.publicCode },
        {
          label: "Tanggal Registrasi",
          value: new Date(document.createdAt).toLocaleString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        { label: "Hash SHA-256", value: formatHashPreview(document.hashSHA256), span: true },
        ...(document.ipfsCid
          ? [{ label: "CID IPFS", value: document.ipfsCid, span: true }]
          : []),
      ]
    : [];

  return (
    <div className="bg-[#080e1c] text-[#f8fafc] min-h-screen selection:bg-[#8ff5ff]/30 selection:text-[#8ff5ff]">
      <Navigation />

      <main className="pt-28 pb-20 px-4 sm:px-6 md:px-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <StatusPanel status={pageStatus} />

          {document ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <section className="lg:col-span-7 glass-card border border-[#424858]/20 p-5 sm:p-6 md:p-8 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8ff5ff] font-bold mb-2">
                      Metadata Publik
                    </p>
                    <h2 className="font-headline text-2xl text-white">
                      Detail Dokumen
                    </h2>
                  </div>
                  <span
                    className={`badge ${
                      document.status === "ACTIVE" ? "badge-active" : "badge-revoked"
                    }`}
                  >
                    {document.status === "ACTIVE" ? "Aktif" : "Dicabut"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metadataItems.map((item) => (
                    <div
                      key={item.label}
                      className={`bg-[#080e1c]/50 p-4 border-l-4 border-[#8ff5ff]/40 ${
                        item.span ? "md:col-span-2" : ""
                      }`}
                    >
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        {item.label}
                      </span>
                      <span className="block text-sm text-white break-all sm:break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lg:col-span-5 min-w-0">
                <QrVerifyForm
                  publicCode={document.publicCode}
                  disabled={document.status === "REVOKED"}
                />
              </section>
            </div>
          ) : (
            <div className="glass-card border border-[#424858]/20 p-5 sm:p-8 text-center">
              <p className="text-slate-400 mb-6">
                Kode publik <code className="text-[#8ff5ff]">{publicCode}</code> tidak
                terhubung ke dokumen manapun.
              </p>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 bg-[#8ff5ff] text-[#080e1c] px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#b3faff] transition-all"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Verifikasi dengan Upload
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-8 bg-[#080e1c] border-t border-[#424858]/15">
        <div className="text-center font-headline text-[10px] uppercase tracking-[0.3em] text-[#e3e7fc]/40">
          © {new Date().getFullYear()} DocuVerify UNY • Universitas Negeri Yogyakarta
        </div>
      </footer>
    </div>
  );
}
