"use client";

import { useState } from "react";

import { AppErrorPayload, CertificateRecord } from "@/lib/types";

type RegisterState = {
  loading: boolean;
  error?: AppErrorPayload;
  certificate?: CertificateRecord;
  message?: string;
  fileName?: string;
  fileSize?: string;
};

const initialState: RegisterState = {
  loading: false
};

export function RegisterForm() {
  const [state, setState] = useState<RegisterState>(initialState);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setState((prev) => ({ ...prev, fileName: file.name, fileSize: `${sizeMB} MB` }));
    }
  }

  async function handleSubmit(formData: FormData) {
    setState((prev) => ({ ...prev, loading: true, error: undefined, certificate: undefined }));

    const response = await fetch("/api/certificates/register", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: payload.error
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      certificate: payload.certificate,
      message: payload.message
    }));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Registration Form Section */}
      <section className="lg:col-span-2 space-y-8">
        {/* Metadata Configuration */}
        <div className="bg-surface-container-low p-8 rounded-xl relative node-accent overflow-hidden">
          <h2 className="text-xs font-label uppercase tracking-[0.2em] text-secondary mb-8">
            Metadata Configuration
          </h2>
          <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">
                Certificate ID
              </label>
              <input
                name="certificateId"
                required
                className="w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface font-headline focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-outline/40"
                placeholder="CERT-2024-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">
                Name / Title
              </label>
              <input
                name="certificateName"
                required
                className="w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface font-headline focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-outline/40"
                placeholder="Professional Certification of Merit"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">
                Owner Address / Entity
              </label>
              <input
                name="ownerName"
                required
                className="w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface font-headline focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-outline/40"
                placeholder="Nama Lengkap Pemilik"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-outline">
                Issue Date
              </label>
              <input
                type="date"
                name="issuedDate"
                required
                className="w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface font-headline focus:ring-1 focus:ring-primary/40 transition-all [color-scheme:dark]"
              />
            </div>

            {/* Submit buttons inside the form but outside the grid */}
            <div className="md:col-span-2 space-y-8 pt-4">
              {/* Asset Upload */}
              <div className="bg-surface-container-low p-0 rounded-xl relative overflow-hidden">
                <h2 className="text-xs font-label uppercase tracking-[0.2em] text-primary-container mb-6">
                  Asset Upload
                </h2>

                {state.fileName ? (
                  <div className="border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer">
                    <div className="flex items-center gap-4 bg-surface-container-highest py-3 px-6 rounded-lg w-full max-w-sm">
                      <span className="material-symbols-outlined text-primary-container text-3xl">description</span>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-on-surface font-medium text-sm truncate">{state.fileName}</p>
                        <p className="text-outline text-xs mt-0.5">{state.fileSize} • Ready to upload</p>
                      </div>
                      <button
                        type="button"
                        className="text-outline hover:text-error transition-colors"
                        onClick={() => setState((prev) => ({ ...prev, fileName: undefined, fileSize: undefined }))}
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-sm">info</span>
                      <p className="text-outline text-xs">Maximum file size: 25MB. PDF accepted.</p>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-outline-variant rounded-xl p-12 flex flex-col items-center justify-center bg-surface-container-lowest/50 group hover:bg-surface-container-highest/30 transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-primary-container text-4xl">
                        cloud_upload
                      </span>
                    </div>
                    <p className="text-on-surface font-medium mb-1">Drag and drop certificate PDF</p>
                    <p className="text-outline text-xs">Maximum file size: 25MB. PDF accepted.</p>
                    <input
                      type="file"
                      name="file"
                      accept="application/pdf,.pdf"
                      required
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="mt-6 flex items-center gap-2">
                      <div className="h-[1px] w-8 bg-outline-variant" />
                      <span className="text-[10px] uppercase tracking-widest text-outline">OR</span>
                      <div className="h-[1px] w-8 bg-outline-variant" />
                    </div>
                    <span className="mt-4 px-8 py-2 border border-outline/30 text-on-surface text-sm hover:bg-surface-container-highest transition-all">
                      Browse Files
                    </span>
                  </label>
                )}

                {state.fileName && (
                  <input type="file" name="file" accept="application/pdf,.pdf" required className="hidden" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="submit"
                  disabled={state.loading}
                  className="flex-1 py-4 primary-gradient text-on-primary-fixed font-headline font-bold tracking-tight rounded-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.2)] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">hub</span>
                  {state.loading ? "Processing..." : "Upload to IPFS"}
                </button>
                <button
                  type="submit"
                  disabled={state.loading}
                  className="flex-1 py-4 bg-surface-container-highest text-white font-headline font-bold tracking-tight rounded-lg border border-outline/10 flex items-center justify-center gap-3 hover:bg-surface-bright active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  {state.loading ? "Processing..." : "Save to Blockchain"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Results Sidebar Section */}
      <aside className="space-y-6">
        {/* Archive Status Card */}
        <div className="bg-surface-container-high p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-8xl">receipt_long</span>
          </div>
          <h2 className="text-[10px] font-label uppercase tracking-[0.2em] text-outline mb-6">
            Archive Status
          </h2>

          {/* Error State */}
          {state.error ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container/20 text-error rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-error" />
                Error
              </div>
              <div className="bg-surface-container-lowest p-3 rounded">
                <p className="text-sm text-error font-medium">{state.error.message}</p>
                {state.error.details ? (
                  <p className="mt-2 text-xs text-on-surface-variant break-words">
                    {state.error.details}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Success State */}
          {state.certificate ? (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/20 text-secondary-fixed-dim rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary-fixed-dim animate-pulse" />
                  Synchronized
                </div>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Message</p>
                <p className="text-sm text-on-surface">{state.message}</p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">IPFS CID</p>
                <div className="bg-surface-container-lowest p-3 rounded font-headline text-[13px] text-primary-container break-all flex items-center justify-between gap-3 border border-outline-variant/30">
                  <span>{state.certificate.cid}</span>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded bg-surface-container-high hover:bg-surface-bright text-outline hover:text-on-surface transition-all shrink-0"
                    title="Copy CID"
                    onClick={() => navigator.clipboard.writeText(state.certificate?.cid ?? "")}
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">
                  Certificate ID
                </p>
                <p className="text-sm font-headline text-on-surface">
                  {state.certificate.certificateId}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">
                  Created At
                </p>
                <p className="text-sm font-headline text-on-surface">
                  {new Date(state.certificate.createdAt * 1000).toLocaleString("id-ID")}
                </p>
              </div>
              {state.certificate.explorerUrl ? (
                <a
                  href={state.certificate.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary-container text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
                >
                  View on Explorer
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              ) : null}

              {/* Network Info */}
              <div className="pt-4 border-t border-outline-variant/30 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Network</p>
                  <p className="text-sm font-headline text-on-surface">Ethereum Sepolia</p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Gas Used</p>
                  <p className="text-sm font-headline text-on-surface">~0.002 ETH</p>
                </div>
              </div>
            </div>
          ) : !state.error ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest mb-1">Status</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest text-on-surface-variant rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-outline" />
                  Awaiting Input
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Submit the form to upload your certificate to IPFS and record it on the blockchain.
                Results will appear here.
              </p>
            </div>
          ) : null}
        </div>

        {/* Technical Specs Card */}
        <div className="bg-surface-container-low p-6 rounded-xl">
          <h3 className="text-[10px] font-label uppercase tracking-[0.2em] text-outline mb-4">
            Encryption Profile
          </h3>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-xs">
              <span className="text-outline">Algorithm</span>
              <span className="text-on-surface font-headline">SHA-256</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <span className="text-outline">Redundancy</span>
              <span className="text-on-surface font-headline">3x Nodes</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <span className="text-outline">Immutability</span>
              <span className="text-secondary font-headline">Verified</span>
            </li>
          </ul>
        </div>

        {/* Danger Zone / Revocation Card */}
        <div className="bg-error-container/10 border border-error/20 p-6 rounded-xl">
          <h3 className="text-[10px] font-label uppercase tracking-[0.2em] text-error mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span> Danger Zone
          </h3>
          <p className="text-xs text-on-surface-variant mb-4">
            Permanently mark this certificate as revoked on the blockchain. This action cannot be undone.
          </p>
          <button className="w-full py-3 bg-error-container text-on-error-container font-headline font-bold text-sm tracking-tight rounded-lg flex items-center justify-center gap-2 hover:bg-error hover:text-on-error transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">gavel</span>
            Revoke Certificate
          </button>
        </div>
      </aside>
    </div>
  );
}
