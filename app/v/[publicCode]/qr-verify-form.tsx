"use client";

import { useRef, useState } from "react";

type QrVerifyStatus = "VALID" | "INVALID" | "NOT_REGISTERED" | "REVOKED";

type QrVerifyResult = {
  status: QrVerifyStatus;
  message: string;
  uploadedHash: string;
  registeredHash: string | null;
  matched: boolean;
};

type Props = {
  publicCode: string;
  disabled?: boolean;
};

export function QrVerifyForm({ publicCode, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QrVerifyResult | null>(null);

  function clearFile() {
    fileRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
    setFileName(null);
    setFileSize(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      clearFile();
      setError("Hanya file PDF yang diterima.");
      setResult(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      clearFile();
      setError("Ukuran file maksimal 10 MB.");
      setResult(null);
      return;
    }

    fileRef.current = file;
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    if (!fileRef.current) {
      setError("Silakan pilih file PDF terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("publicCode", publicCode);
      formData.append("file", fileRef.current);

      const res = await fetch("/api/verify/qr", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal memverifikasi dokumen.");
        setLoading(false);
        return;
      }

      clearFile();
      setResult(data as QrVerifyResult);
      setLoading(false);
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi Anda dan coba lagi.");
      setLoading(false);
    }
  }

  const statusConfig = {
    VALID: {
      icon: "verified",
      label: "VALID",
      className: "border-secondary/30 bg-secondary/10 text-secondary",
    },
    INVALID: {
      icon: "gpp_bad",
      label: "INVALID",
      className: "border-error/30 bg-error/10 text-error",
    },
    NOT_REGISTERED: {
      icon: "help_outline",
      label: "NOT_REGISTERED",
      className: "border-[#ffb400]/30 bg-[#ffb400]/10 text-[#ffb400]",
    },
    REVOKED: {
      icon: "block",
      label: "REVOKED",
      className: "border-error/30 bg-error/10 text-error",
    },
  } satisfies Record<QrVerifyStatus, { icon: string; label: string; className: string }>;

  return (
    <div className="glass-card border border-[#424858]/20 p-5 sm:p-6 md:p-8">
      <h2 className="font-headline text-xl text-white mb-2">
        Bandingkan File PDF
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Unggah PDF yang Anda pegang untuk memastikan hash file cocok dengan data resmi dari QR ini.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fileName ? (
          <div className="border border-[#8ff5ff]/30 bg-[#8ff5ff]/5 p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{fileName}</p>
              <p className="text-xs text-secondary">{fileSize} siap diverifikasi</p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearFile();
                setError(null);
                setResult(null);
              }}
              className="p-2 text-slate-400 hover:text-error"
              title="Hapus file"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ) : (
          <label
            className={`block border-2 border-dashed p-8 text-center transition-colors ${
              disabled
                ? "border-[#424858]/20 opacity-50 cursor-not-allowed"
                : "border-[#424858]/40 hover:bg-[#8ff5ff]/5 hover:border-[#8ff5ff]/30 cursor-pointer"
            }`}
          >
            <span className="material-symbols-outlined text-4xl text-slate-500 mb-3 block">
              upload_file
            </span>
            <span className="text-sm text-slate-400">
              Pilih file PDF untuk dibandingkan
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={disabled}
              onChange={handleFileChange}
            />
          </label>
        )}

        {error && (
          <div className="border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || loading || !fileName}
          className="min-h-12 w-full bg-[#8ff5ff] text-[#080e1c] py-4 px-4 font-headline font-bold text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest hover:bg-[#b3faff] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            "Memproses Verifikasi..."
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">security</span>
              Verifikasi File
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`mt-6 border p-5 ${statusConfig[result.status].className}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {statusConfig[result.status].icon}
            </span>
            <span className="font-headline font-bold tracking-widest">
              {statusConfig[result.status].label}
            </span>
          </div>
          <p className="text-sm text-slate-200 mb-4">{result.message}</p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                Hash File Upload
              </p>
              <code className="block bg-[#080e1c]/70 p-3 text-[11px] text-slate-300 break-all">
                {result.uploadedHash}
              </code>
            </div>
            {result.registeredHash && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Hash Resmi
                </p>
                <code className="block bg-[#080e1c]/70 p-3 text-[11px] text-slate-300 break-all">
                  {result.registeredHash}
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
