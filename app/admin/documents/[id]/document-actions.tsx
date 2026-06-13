"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getCsrfToken } from "@/lib/client-csrf";

type Props = {
  documentId: number;
  qrContent: string;
  fileName: string;
  hashSHA256: string;
  ipfsCid: string | null;
  status: string;
};

export function DocumentActions({
  documentId,
  qrContent,
  fileName,
  hashSHA256,
  ipfsCid,
  status,
}: Props) {
  const router = useRouter();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderQrCode() {
      if (!qrCanvasRef.current) return;

      try {
        setQrError(null);
        await QRCode.toCanvas(qrCanvasRef.current, qrContent, {
          width: 200,
          margin: 2,
          errorCorrectionLevel: "M",
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
      } catch {
        if (!cancelled) {
          setQrError("QR Code gagal dibuat. Muat ulang halaman.");
        }
      }
    }

    void renderQrCode();
    return () => {
      cancelled = true;
    };
  }, [qrContent]);

  async function handleRevoke() {
    setRevoking(true);
    setRevokeError(null);

    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setRevokeError(
          data?.error?.message ?? "Gagal mencabut dokumen. Coba lagi."
        );
        setRevoking(false);
        return;
      }

      // Refresh server-rendered data
      setShowRevokeConfirm(false);
      setRevoking(false);
      router.refresh();
    } catch {
      setRevokeError("Gagal terhubung ke server. Periksa koneksi Anda.");
      setRevoking(false);
    }
  }

  function downloadQR() {
    if (!qrCanvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-dokumen-${documentId}.png`;
    link.href = qrCanvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="space-y-6">
      {/* Hash Info */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <h3 className="font-headline text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8ff5ff] text-lg">
            fingerprint
          </span>
          Hash Kriptografis
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
              SHA-256 Hash
            </p>
            <div className="bg-[#080e1c] p-3 rounded-lg border border-[#424858]/30">
              <code className="text-[11px] text-[#8ff5ff] font-mono break-all leading-relaxed">
                {hashSHA256}
              </code>
            </div>
          </div>
          {ipfsCid && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                IPFS CID (Pinata)
              </p>
              <div className="bg-[#080e1c] p-3 rounded-lg border border-[#424858]/30">
                <code className="text-[11px] text-secondary font-mono break-all leading-relaxed">
                  {ipfsCid}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <h3 className="font-headline text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8ff5ff] text-lg">
            qr_code_2
          </span>
          QR Code Dokumen
        </h3>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-lg">
            <canvas ref={qrCanvasRef} width={200} height={200} />
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            {ipfsCid
              ? "QR Code berisi tautan IPFS Gateway"
              : "QR Code berisi hash SHA-256 dokumen"}
          </p>
          {qrError && (
            <p className="text-xs text-error text-center">{qrError}</p>
          )}
          <button
            onClick={downloadQR}
            className="w-full py-3 bg-surface-container-highest text-white font-headline font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-surface-bright transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Unduh QR Code
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
        <h3 className="font-headline text-sm font-bold text-white mb-4">
          Aksi Cepat
        </h3>
        <div className="space-y-2">
          <a
            href={`/api/documents/${documentId}/file?download=1`}
            className="w-full py-3 bg-surface-container-highest text-white font-headline font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-surface-bright transition-all"
            title={fileName}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Unduh Dokumen Asli
          </a>
          <a
            href={`/api/documents/${documentId}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-surface-container-highest text-white font-headline font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-surface-bright transition-all"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Pratinjau PDF
          </a>

          {status === "REVOKED" ? (
            <button
              disabled
              className="w-full py-3 bg-error/5 border border-error/10 text-error/50 font-headline font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">block</span>
              Dokumen Sudah Dicabut
            </button>
          ) : showRevokeConfirm ? (
            <div className="bg-error/5 border border-error/20 rounded-lg p-4 space-y-3">
              <p className="text-xs text-error font-medium">
                Apakah Anda yakin ingin mencabut dokumen ini? Status akan diubah
                ke REVOKED dan verifikasi publik akan menampilkan INVALID.
              </p>
              {revokeError && (
                <p className="text-xs text-error/80 italic">{revokeError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRevokeConfirm(false);
                    setRevokeError(null);
                  }}
                  disabled={revoking}
                  className="flex-1 py-2 bg-surface-container-highest text-white font-headline font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-surface-bright transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex-1 py-2 bg-error text-white font-headline font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-error/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {revoking ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    "Ya, Cabut"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRevokeConfirm(true)}
              className="w-full py-3 bg-error/10 border border-error/20 text-error font-headline font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-error/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">block</span>
              Cabut Dokumen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
