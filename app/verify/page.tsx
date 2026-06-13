import { Navigation } from "@/components/navigation";
import { VerifyForm } from "@/components/verify-form";

export default function VerifyPage() {
  return (
    <div className="bg-[#080e1c] text-[#f8fafc] min-h-screen selection:bg-[#8ff5ff]/30 selection:text-[#8ff5ff]">
      <Navigation />

      <main className="pt-28 pb-20 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 rounded-full mb-6">
              <span className="material-symbols-outlined text-[#8ff5ff] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8ff5ff] font-bold">
                Verifikasi Publik
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif-accent text-white tracking-tight glow-text mb-4">
              Verifikasi Keaslian Dokumen
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Unggah file PDF dokumen akademik untuk memeriksa keasliannya.
              Sistem akan menghitung hash kriptografis dan mencocokkannya dengan database secara otomatis.
            </p>
          </header>

          <VerifyForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-[#080e1c] border-t border-[#424858]/15">
        <div className="text-center font-headline text-[10px] uppercase tracking-[0.3em] text-[#e3e7fc]/40">
          © {new Date().getFullYear()} DocuVerify UNY • Universitas Negeri Yogyakarta
        </div>
      </footer>
    </div>
  );
}
