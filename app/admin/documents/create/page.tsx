"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { AdminLayout } from "@/components/admin-layout";
import { getCsrfToken } from "@/lib/client-csrf";
import { facultyList, documentTypeList } from "@/lib/constants";

type CreateState = {
  loading: boolean;
  success: boolean;
  error?: string;
  fileName?: string;
  fileSize?: string;
  computedHash?: string;
  documentId?: number;
  ipfsCid?: string | null;
};

export default function AdminDocumentCreatePage() {
  const [state, setState] = useState<CreateState>({
    loading: false,
    success: false,
  });
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function clearSelectedFile() {
    fileRef.current = null;
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
      const isPdfMime = file.type === "application/pdf";
      if (!isPdfExt && !isPdfMime) {
        clearSelectedFile();
        setState((prev) => ({
          ...prev,
          error: "Hanya file PDF yang diterima. Pastikan file memiliki ekstensi .pdf.",
          fileName: undefined,
          fileSize: undefined,
        }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        clearSelectedFile();
        setState((prev) => ({
          ...prev,
          error: `Ukuran file maksimal 10 MB. File Anda: ${sizeMB} MB.`,
          fileName: undefined,
          fileSize: undefined,
        }));
        return;
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      fileRef.current = file;
      setState((prev) => ({ ...prev, fileName: file.name, fileSize: `${sizeMB} MB`, error: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileRef.current) {
      setState((prev) => ({ ...prev, error: "File PDF wajib diunggah." }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      // Build FormData dari elemen form + file
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);
      // Pastikan file dari ref (kalau user pilih ulang)
      formData.set("file", fileRef.current);
      const csrfToken = await getCsrfToken();

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            data?.error?.message ??
            "Gagal mendaftarkan dokumen. Silakan coba lagi.",
        }));
        return;
      }

      clearSelectedFile();
      setState({
        loading: false,
        success: true,
        computedHash: data.document?.hashSHA256,
        documentId: data.document?.id,
        ipfsCid: data.document?.ipfsCid ?? null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Gagal terhubung ke server. Periksa koneksi Anda dan coba lagi.",
      }));
    }
  }

  if (state.success) {
    return (
      <AdminLayout title="Dokumen Berhasil Didaftarkan">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="w-24 h-24 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-8 ring-4 ring-secondary/10">
            <span
              className="material-symbols-outlined text-6xl text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h2 className="font-headline text-3xl font-bold text-white mb-4">
            Dokumen Berhasil Didaftarkan!
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Dokumen akademik telah berhasil didaftarkan ke dalam sistem. Hash SHA-256 telah dihitung
            dan disimpan ke database.
          </p>
          <div className="bg-surface-container-low rounded-xl p-6 mb-8 border border-outline-variant/10 text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">SHA-256 Hash</p>
            <div className="bg-[#080e1c] p-3 rounded-lg border border-[#424858]/30">
              <code className="text-xs text-[#8ff5ff] font-mono break-all">
                {state.computedHash ?? "—"}
              </code>
            </div>
            {state.ipfsCid && (
              <>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 mt-4">IPFS CID (Pinata)</p>
                <div className="bg-[#080e1c] p-3 rounded-lg border border-[#424858]/30">
                  <code className="text-xs text-secondary font-mono break-all">
                    {state.ipfsCid}
                  </code>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {state.documentId && (
              <Link
                href={`/admin/documents/${state.documentId}`}
                className="bg-[#8ff5ff] text-[#080e1c] px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-[#b3faff] transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Lihat Detail
              </Link>
            )}
            <Link
              href="/admin/documents"
              className="border border-[#424858]/30 text-white px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">list</span>
              Daftar Dokumen
            </Link>
            <button
              onClick={() => {
                clearSelectedFile();
                setState({ loading: false, success: false });
              }}
              className="border border-[#424858]/30 text-white px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Daftarkan Lagi
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Pendaftaran Dokumen"
      subtitle="Daftarkan dokumen akademik baru ke dalam sistem verifikasi."
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
        {/* Main Form */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Metadata Section */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-8">
              <h2 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8ff5ff]">edit_note</span>
                Metadata Dokumen
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Judul */}
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="title" className="form-label">Judul Dokumen *</label>
                  <input
                    id="title"
                    name="title"
                    required
                    className="form-input"
                    placeholder="Contoh: Pengembangan Sistem Informasi Akademik Berbasis Web"
                  />
                </div>

                {/* Jenis Dokumen */}
                <div className="space-y-2">
                  <label htmlFor="documentType" className="form-label">Jenis Dokumen *</label>
                  <select id="documentType" name="documentType" required className="form-select">
                    <option value="">Pilih jenis dokumen</option>
                    {documentTypeList.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Tahun */}
                <div className="space-y-2">
                  <label htmlFor="documentYear" className="form-label">Tahun Dokumen *</label>
                  <input
                    id="documentYear"
                    name="documentYear"
                    type="number"
                    required
                    min="2000"
                    max="2099"
                    className="form-input"
                    placeholder="2024"
                  />
                </div>

                {/* Nama Pemilik */}
                <div className="space-y-2">
                  <label htmlFor="ownerName" className="form-label">Nama Pemilik *</label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    required
                    className="form-input"
                    placeholder="Nama lengkap pemilik dokumen"
                  />
                </div>

                {/* NIM */}
                <div className="space-y-2">
                  <label htmlFor="ownerIdentity" className="form-label">NIM *</label>
                  <input
                    id="ownerIdentity"
                    name="ownerIdentity"
                    required
                    className="form-input"
                    placeholder="20108241015"
                  />
                </div>

                {/* Fakultas */}
                <div className="space-y-2">
                  <label htmlFor="faculty" className="form-label">Fakultas *</label>
                  <select id="faculty" name="faculty" required className="form-select">
                    <option value="">Pilih fakultas</option>
                    {facultyList.map((fac) => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                </div>

                {/* Program Studi */}
                <div className="space-y-2">
                  <label htmlFor="studyProgram" className="form-label">Program Studi *</label>
                  <input
                    id="studyProgram"
                    name="studyProgram"
                    required
                    className="form-input"
                    placeholder="Pendidikan Teknik Informatika"
                  />
                </div>
              </div>

              {/* Institution (read-only) */}
              <div className="mt-6 p-4 bg-[#8ff5ff]/5 border border-[#8ff5ff]/10 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-[#8ff5ff]">account_balance</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Institusi</p>
                  <p className="text-white font-medium text-sm">Universitas Negeri Yogyakarta</p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-8">
              <h2 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8ff5ff]">upload_file</span>
                Unggah Dokumen
              </h2>

              {state.fileName ? (
                <div className="border-2 border-dashed border-[#8ff5ff]/40 bg-[#8ff5ff]/5 rounded-xl p-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-surface-container-highest rounded-lg flex items-center justify-center border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[#8ff5ff] text-3xl">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="text-white font-medium truncate max-w-[300px]">{state.fileName}</p>
                      <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Siap diunggah ({state.fileSize})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-error transition-colors p-2 rounded-full hover:bg-error/10"
                    onClick={() => {
                      clearSelectedFile();
                      setState((prev) => ({
                        ...prev,
                        fileName: undefined,
                        fileSize: undefined,
                        error: undefined,
                      }));
                    }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#424858]/40 rounded-xl p-12 flex flex-col items-center justify-center hover:bg-[#8ff5ff]/5 hover:border-[#8ff5ff]/30 transition-all cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[#8ff5ff] text-4xl">cloud_upload</span>
                  </div>
                  <p className="text-white font-medium mb-1">Seret dan lepas file PDF di sini</p>
                  <p className="text-slate-500 text-xs">Maksimal 10 MB • Hanya format PDF</p>
                  <input
                    ref={inputRef}
                    type="file"
                    name="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="mt-6 flex items-center gap-2">
                    <div className="h-[1px] w-8 bg-[#424858]" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">atau</span>
                    <div className="h-[1px] w-8 bg-[#424858]" />
                  </div>
                  <span className="mt-4 px-8 py-2 border border-[#424858]/30 text-white text-sm hover:bg-surface-container-highest transition-all rounded-lg">
                    Pilih File
                  </span>
                </label>
              )}
            </div>

            {/* Error */}
            {state.error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/20 rounded-lg">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="text-sm text-error">{state.error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={state.loading}
                className="flex-1 bg-[#8ff5ff] text-[#080e1c] py-4 font-headline font-bold text-sm tracking-tight hover:bg-[#b3faff] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(143,245,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses Pendaftaran...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Daftarkan Dokumen
                  </>
                )}
              </button>
              <button
                type="reset"
                className="px-8 py-4 border border-[#424858]/30 text-slate-300 font-headline font-bold text-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  clearSelectedFile();
                  setState({ loading: false, success: false });
                }}
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <h3 className="font-headline text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff] text-lg">help</span>
              Panduan Pendaftaran
            </h3>
            <ol className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <li className="flex gap-3">
                <span className="text-[#8ff5ff] font-bold shrink-0">1.</span>
                Isi semua metadata dokumen dengan lengkap dan benar.
              </li>
              <li className="flex gap-3">
                <span className="text-[#8ff5ff] font-bold shrink-0">2.</span>
                Unggah file PDF dokumen asli (maksimal 10 MB).
              </li>
              <li className="flex gap-3">
                <span className="text-[#8ff5ff] font-bold shrink-0">3.</span>
                Sistem akan menghitung hash SHA-256 dan menyimpannya ke database.
              </li>
              <li className="flex gap-3">
                <span className="text-[#8ff5ff] font-bold shrink-0">4.</span>
                Dokumen yang terdaftar bisa diverifikasi oleh siapapun.
              </li>
            </ol>
          </div>

          {/* Accepted Document Types */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <h3 className="font-headline text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#8ff5ff] text-lg">description</span>
              Jenis Dokumen Diterima
            </h3>
            <ul className="space-y-2">
              {documentTypeList.map((type) => (
                <li key={type} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-secondary text-sm">check</span>
                  {type}
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Info */}
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
            <h3 className="font-headline text-sm font-bold text-white mb-4">Spesifikasi Teknis</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Algoritma Hash</span>
                <span className="text-white font-headline">SHA-256</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Format File</span>
                <span className="text-white font-headline">PDF</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Maks. Ukuran</span>
                <span className="text-white font-headline">10 MB</span>
              </li>
              <li className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Institusi</span>
                <span className="text-[#8ff5ff] font-headline">UNY</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
