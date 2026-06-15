"use client";

import { useCallback, useRef, useState } from "react";

import { VerificationResultReveal } from "@/components/verification-result-reveal";

type VerificationStatus = "VALID" | "NOT_REGISTERED" | "INVALID";

type VerifyResult = {
  status: VerificationStatus;
  message: string;
  uploadedHash: string;
  referenceHash?: string;
  document?: {
    title: string;
    documentType: string;
    ownerName: string;
    ownerIdentity: string;
    faculty: string;
    studyProgram: string;
    documentYear: number;
    institution: string;
  };
};

type VerifyState = {
  loading: boolean;
  error?: string;
  result?: VerifyResult;
  fileName?: string;
  fileSize?: string;
};

export function VerifyForm() {
  const [state, setState] = useState<VerifyState>({ loading: false });
  const [pendingResult, setPendingResult] = useState<VerifyResult | null>(null);
  const [showResultReveal, setShowResultReveal] = useState(false);
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const finishResultReveal = useCallback(() => {
    if (!pendingResult) {
      setShowResultReveal(false);
      return;
    }

    setShowResultReveal(false);
    setState({
      loading: false,
      result: pendingResult,
    });
    setPendingResult(null);
  }, [pendingResult]);

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
          result: undefined,
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
          result: undefined,
          fileName: undefined,
          fileSize: undefined,
        }));
        return;
      }
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      fileRef.current = file;
      setState((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: `${sizeMB} MB`,
        error: undefined,
        result: undefined,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileRef.current) {
      setState((prev) => ({ ...prev, error: "Silakan pilih file PDF terlebih dahulu." }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined, result: undefined }));

    try {
      // Kirim file ke backend — SHA-256 dihitung authoritatively di server
      const formData = new FormData();
      formData.append("file", fileRef.current);

      const res = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            data?.error?.message ??
            "Gagal memverifikasi dokumen. Silakan coba lagi.",
        }));
        return;
      }

      clearSelectedFile();
      setPendingResult(data as VerifyResult);
      setState({
        loading: false,
      });
      setShowResultReveal(true);
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
      }));
    }
  }

  const statusConfig = {
    VALID: {
      icon: "verified",
      label: "VALID",
      sublabel: "Dokumen Terverifikasi",
      colorClass: "text-secondary",
      bgClass: "bg-secondary/10 border-secondary/20",
      ringClass: "ring-secondary/20",
      badgeClass: "badge-valid",
      glowShadow: "shadow-[0_0_30px_rgba(78,222,163,0.1)]",
    },
    NOT_REGISTERED: {
      icon: "help_outline",
      label: "TIDAK TERDAFTAR",
      sublabel: "Dokumen Belum Terdaftar",
      colorClass: "text-[#ffb400]",
      bgClass: "bg-[#ffb400]/10 border-[#ffb400]/20",
      ringClass: "ring-[#ffb400]/20",
      badgeClass: "badge-not-registered",
      glowShadow: "shadow-[0_0_30px_rgba(255,180,0,0.1)]",
    },
    INVALID: {
      icon: "gpp_bad",
      label: "TIDAK VALID",
      sublabel: "Dokumen Tidak Asli",
      colorClass: "text-error",
      bgClass: "bg-error/10 border-error/20",
      ringClass: "ring-error/20",
      badgeClass: "badge-invalid",
      glowShadow: "shadow-[0_0_30px_rgba(255,180,171,0.1)]",
    },
  };

  return (
    <>
    <VerificationResultReveal
      visible={showResultReveal}
      onDone={finishResultReveal}
    />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Upload Form */}
      <div className="lg:col-span-5 space-y-6 min-w-0">
        <form
          onSubmit={handleSubmit}
          className="glass-card neon-border p-5 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8ff5ff]" />

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#8ff5ff] mb-4">
                Unggah Dokumen PDF
              </label>

              {state.fileName ? (
                /* File selected state */
                <div className="border-2 border-dashed border-[#8ff5ff]/40 bg-[#8ff5ff]/5 rounded-xl p-6 text-center cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-surface-container-highest rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[#8ff5ff] text-2xl">picture_as_pdf</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold text-white mb-1 truncate">{state.fileName}</p>
                      <p className="text-xs text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Siap diverifikasi ({state.fileSize})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container-highest shrink-0"
                    title="Hapus file"
                    onClick={() => {
                      clearSelectedFile();
                      setState((prev) => ({
                        ...prev,
                        error: undefined,
                        result: undefined,
                        fileName: undefined,
                        fileSize: undefined,
                      }));
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ) : (
                /* Drop zone state */
                <label className="border-2 border-dashed border-[#424858]/40 rounded-xl p-8 sm:p-12 text-center hover:bg-[#8ff5ff]/5 hover:border-[#8ff5ff]/30 transition-colors cursor-pointer group block">
                  <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-[#8ff5ff] transition-colors mb-3 block">
                    upload_file
                  </span>
                  <p className="text-sm text-slate-400">
                    Seret dan lepas file PDF di sini atau{" "}
                    <span className="text-[#8ff5ff] underline">pilih file</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-2">Maksimal 10 MB • Hanya PDF</p>
                  <input
                    ref={inputRef}
                    type="file"
                    name="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {state.error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/20 rounded-lg">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="text-sm text-error">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={state.loading || !state.fileName}
              className="min-h-12 w-full bg-[#8ff5ff] text-[#080e1c] py-5 px-4 font-headline font-bold text-base sm:text-lg tracking-tight hover:bg-[#b3faff] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(143,245,255,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses Verifikasi...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">security</span>
                  Verifikasi Dokumen
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <div className="glass-card p-6 border border-[#424858]/20">
          <h4 className="font-headline text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8ff5ff] text-sm">info</span>
            Cara Kerja Verifikasi
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed font-body">
            Sistem menghitung hash SHA-256 dari file yang Anda unggah dan membandingkannya
            dengan hash yang tersimpan di database saat dokumen pertama kali didaftarkan.
            Jika hash cocok, dokumen dinyatakan valid dan asli. Anda <strong className="text-slate-300">tidak perlu</strong> memasukkan
            kode atau nomor dokumen apapun.
          </p>
        </div>
      </div>

      {/* Right Column: Results */}
      <div className="lg:col-span-7 space-y-6 min-w-0">
        {/* Status Card */}
        <div className={`glass-card overflow-hidden relative ${
          state.result
            ? `border ${statusConfig[state.result.status].bgClass.split(" ")[1]} ${statusConfig[state.result.status].glowShadow}`
            : "border border-[#424858]/20"
        }`}>
          <div className="p-6 sm:p-10 flex flex-col items-center text-center">
            {state.result ? (() => {
              const config = statusConfig[state.result.status];
              return (
                <>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ring-4 ${config.bgClass} ${config.ringClass}`}>
                    <span
                      className={`material-symbols-outlined text-6xl ${config.colorClass}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {config.icon}
                    </span>
                  </div>
                  <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-2 break-words">
                    <span className={config.colorClass}>
                      {config.label}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-400 mb-1">{config.sublabel}</p>
                  <p className="text-slate-300 mt-2 max-w-md">{state.result.message}</p>
                </>
              );
            })() : (
              <>
                <div className="w-24 h-24 rounded-full bg-surface-container-highest flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-6xl text-slate-600">
                    shield
                  </span>
                </div>
                <h2 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tighter text-slate-600 mb-2">
                  MENUNGGU INPUT
                </h2>
                <p className="text-slate-500 text-sm max-w-md">
                  Unggah file PDF dokumen akademik untuk memulai proses verifikasi.
                  Hasil akan tampil di sini secara otomatis.
                </p>
              </>
            )}
          </div>

          {/* Hash Comparison */}
          {state.result && (
            <div className="bg-surface-container-highest/20 p-5 sm:p-8 border-t border-[#424858]/20 relative">
              {state.result.status === "VALID" && state.result.referenceHash && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080e1c] border-2 border-secondary rounded-full w-8 h-8 z-10 hidden md:flex items-center justify-center shadow-[0_0_15px_rgba(78,222,163,0.3)]">
                  <span className="material-symbols-outlined text-secondary text-sm font-bold">check</span>
                </div>
              )}
              <div className={`grid grid-cols-1 ${state.result.referenceHash ? "md:grid-cols-2" : ""} gap-8 relative`}>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    Hash File yang Diunggah
                  </span>
                  <div className={`bg-[#080e1c] p-4 rounded-lg border ${
                    state.result.status === "VALID"
                      ? "border-secondary/30"
                      : state.result.status === "NOT_REGISTERED"
                      ? "border-[#ffb400]/30"
                      : "border-error/30"
                  }`}>
                    <code className="text-xs break-all font-mono text-slate-300">
                      {state.result.uploadedHash}
                    </code>
                  </div>
                </div>
                {state.result.referenceHash && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px]">database</span>
                      Hash Tersimpan di Database
                    </span>
                    <div className={`bg-[#080e1c] p-4 rounded-lg border ${
                      state.result.status === "VALID" ? "border-secondary/30" : "border-error/30"
                    }`}>
                      <code className="text-xs break-all font-mono text-slate-300">
                        {state.result.referenceHash}
                      </code>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 text-center">
                <span className={`${statusConfig[state.result.status].badgeClass} badge`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {statusConfig[state.result.status].icon}
                  </span>
                  {state.result.status === "VALID"
                    ? "Hash Cocok — Dokumen Asli"
                    : state.result.status === "NOT_REGISTERED"
                    ? "Hash Tidak Ditemukan di Database"
                    : "Hash Tidak Cocok — Terindikasi Pemalsuan"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Document Details (when VALID) */}
        {state.result?.status === "VALID" && state.result.document && (
          <div className="glass-card p-5 sm:p-8 border border-secondary/10 animate-fade-in-up">
            <h3 className="font-headline text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                description
              </span>
              Detail Dokumen Terdaftar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-secondary">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Judul Dokumen
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.title}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-[#8ff5ff]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Jenis Dokumen
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.documentType}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-secondary">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Nama Pemilik
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.ownerName}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-[#8ff5ff]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  NIM
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.ownerIdentity}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-secondary">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Fakultas
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.faculty}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-[#8ff5ff]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Program Studi
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.studyProgram}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-secondary">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Tahun Dokumen
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.documentYear}
                </span>
              </div>
              <div className="bg-[#080e1c]/50 p-4 rounded-lg border-l-4 border-[#8ff5ff]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Institusi
                </span>
                <span className="font-headline text-white font-medium text-sm">
                  {state.result.document.institution}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
