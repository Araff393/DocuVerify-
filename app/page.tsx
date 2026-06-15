import Link from "next/link";
import Image from "next/image";

import { LandingSplineScene } from "@/components/landing-spline-scene";
import { Navigation } from "@/components/navigation";

export default function HomePage() {
  return (
    <div className="bg-[#080e1c] text-[#f8fafc] selection:bg-[#8ff5ff]/30 selection:text-[#8ff5ff]">
      <Navigation />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center px-4 sm:px-6 md:px-16 overflow-hidden grid-pattern py-20 pt-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080e1c]/50 to-[#080e1c] pointer-events-none" />
          <div className="max-w-4xl z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-[#8ff5ff] pulse-dot" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8ff5ff] font-bold">
                Universitas Negeri Yogyakarta
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif-accent text-white leading-[1.08] mb-8 tracking-tight glow-text">
              Sistem Verifikasi Keaslian Dokumen Akademik
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-normal max-w-2xl mb-12 leading-relaxed">
              Pastikan keaslian dokumen akademik Anda secara aman dan transparan
              melalui teknologi hash kriptografis berstandar institusi.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/verify"
                className="min-h-12 bg-[#8ff5ff] text-[#080e1c] px-6 sm:px-10 py-5 text-xs sm:text-sm font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] hover:bg-[#b3faff] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[0_0_20px_rgba(143,245,255,0.3)]"
              >
                <span className="material-symbols-outlined text-xl">verified_user</span>
                Verifikasi Dokumen
              </Link>
              <Link
                href="/admin/login"
                className="min-h-12 border border-[#8ff5ff]/30 text-white px-6 sm:px-10 py-5 text-xs sm:text-sm font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] hover:bg-[#8ff5ff]/10 hover:border-[#8ff5ff]/60 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">login</span>
                Login Admin
              </Link>
            </div>
          </div>

          {/* Abstract Tech Visual */}
          <div className="absolute right-[-15%] xl:right-[-5%] top-1/2 -translate-y-1/2 w-[55%] xl:w-[45%] h-[80%] hidden lg:block lg:opacity-60 xl:opacity-100 pointer-events-none xl:pointer-events-auto">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-[#080e1c] to-transparent z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#8ff5ff]/20 blur-[120px] rounded-full" />
              <div className="landing-spline-frame">
                <LandingSplineScene />
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 md:py-32 px-4 sm:px-6 md:px-16 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 md:mb-24 gap-8">
              <div>
                <span className="text-[#8ff5ff] text-xs font-bold uppercase tracking-[0.4em] block mb-4">
                  Alur Verifikasi
                </span>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif-accent text-white tracking-tight glow-text">
                  Proses Verifikasi Dokumen
                </h3>
              </div>
              <p className="text-slate-500 max-w-md text-xs uppercase tracking-widest leading-loose lg:text-right">
                Tiga langkah sederhana untuk memastikan keaslian dokumen akademik Anda
                secara aman dan terpercaya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Step 1 */}
              <div className="glass-card neon-border p-6 sm:p-10 md:p-12 transition-all group relative overflow-hidden">
                <div className="scan-line" />
                <div className="w-16 h-16 border border-[#8ff5ff]/30 flex items-center justify-center mb-10 group-hover:border-[#8ff5ff] group-hover:bg-[#8ff5ff]/5 transition-all duration-500">
                  <span className="material-symbols-outlined text-4xl text-[#8ff5ff]">upload_file</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">01. Unggah Dokumen</h4>
                <p className="text-[#e3e7fc]/70 leading-relaxed font-normal">
                  Admin mengunggah dokumen akademik asli dalam format PDF beserta
                  metadata lengkap seperti judul, NIM, fakultas, dan program studi.
                </p>
              </div>

              {/* Step 2 */}
              <div className="glass-card neon-border p-6 sm:p-10 md:p-12 transition-all group relative overflow-hidden">
                <div className="scan-line" style={{ animationDelay: "1.5s" }} />
                <div className="w-16 h-16 border border-[#8ff5ff]/30 flex items-center justify-center mb-10 group-hover:border-[#8ff5ff] group-hover:bg-[#8ff5ff]/5 transition-all duration-500">
                  <span className="material-symbols-outlined text-4xl text-[#8ff5ff]">fingerprint</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">02. Hash Kriptografis</h4>
                <p className="text-[#e3e7fc]/70 leading-relaxed font-normal">
                  Sistem menghasilkan sidik jari digital unik (SHA-256 hash) dari dokumen
                  dan menyimpannya ke dalam database sebagai bukti keaslian.
                </p>
              </div>

              {/* Step 3 */}
              <div className="glass-card neon-border p-6 sm:p-10 md:p-12 transition-all group relative overflow-hidden">
                <div className="scan-line" style={{ animationDelay: "3s" }} />
                <div className="w-16 h-16 border border-[#8ff5ff]/30 flex items-center justify-center mb-10 group-hover:border-[#8ff5ff] group-hover:bg-[#8ff5ff]/5 transition-all duration-500">
                  <span className="material-symbols-outlined text-4xl text-[#8ff5ff]">policy</span>
                </div>
                <h4 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">03. Verifikasi Instan</h4>
                <p className="text-[#e3e7fc]/70 leading-relaxed font-normal">
                  Pihak manapun dapat memverifikasi keaslian dokumen cukup dengan mengunggah
                  file PDF — sistem otomatis membandingkan hash secara real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 md:py-32 px-4 sm:px-6 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <span className="text-[#8ff5ff] text-xs font-bold uppercase tracking-[0.5em] block mb-4">
                Keunggulan Sistem
              </span>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif-accent text-white tracking-tight">
                Pilar Keamanan Dokumen
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-rows-2 gap-6 h-auto lg:min-h-[650px]">
              {/* Large Feature: Hash Security */}
              <div className="md:col-span-6 lg:col-span-3 lg:row-span-2 glass-card neon-border p-6 sm:p-10 md:p-12 flex flex-col justify-between relative overflow-hidden group">
                <div className="z-10">
                  <span className="material-symbols-outlined text-6xl mb-8 block text-[#8ff5ff]">enhanced_encryption</span>
                  <h4 className="text-3xl font-serif-accent text-white mb-6 tracking-tight">
                    Keamanan Hash SHA-256
                  </h4>
                  <p className="text-[#e3e7fc]/70 text-lg max-w-md leading-relaxed font-normal">
                    Setiap dokumen menghasilkan sidik jari digital unik menggunakan algoritma SHA-256.
                    Perubahan sekecil apapun pada dokumen akan menghasilkan hash yang berbeda total,
                    sehingga pemalsuan dapat terdeteksi secara instan.
                  </p>
                </div>
                <div className="mt-12 flex items-center gap-2 z-10">
                  <span className="px-5 py-2 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 text-[#8ff5ff] text-[10px] uppercase tracking-[0.3em] font-bold">
                    Algoritma: SHA-256
                  </span>
                </div>
                {/* Background Pattern Decor */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                  <span className="material-symbols-outlined text-[400px]">lock</span>
                </div>
              </div>

              {/* Verification Speed */}
              <div className="md:col-span-6 lg:col-span-3 glass-card neon-border p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <span className="material-symbols-outlined text-[#8ff5ff] text-3xl">bolt</span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wider">Verifikasi Instan</h4>
                  </div>
                  <p className="text-[#e3e7fc]/70 font-normal">
                    Cukup unggah file PDF — tidak perlu memasukkan kode atau nomor dokumen apapun.
                    Sistem secara otomatis menghitung hash dan mencocokkannya dengan database dalam hitungan detik.
                  </p>
                </div>
                <div className="mt-8 p-4 bg-black/40 border border-[#8ff5ff]/10 font-mono text-[11px] text-[#8ff5ff]/80 truncate">
                  SHA-256: a3f2c8e91d4b7f6a0e5c3d...b2a1
                </div>
              </div>

              {/* Transparent Records */}
              <div className="md:col-span-6 lg:col-span-2 glass-card neon-border p-6 sm:p-10 flex flex-col justify-center">
                <span className="material-symbols-outlined text-[#8ff5ff] mb-6 text-4xl">history</span>
                <h4 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Riwayat Transparan</h4>
                <p className="text-[#e3e7fc]/70 text-sm leading-relaxed font-normal">
                  Setiap verifikasi tercatat dalam riwayat sistem, memberikan audit trail
                  yang lengkap dan transparan.
                </p>
              </div>

              {/* Trusted Results */}
              <div className="md:col-span-6 lg:col-span-1 bg-[#8ff5ff] p-8 sm:p-10 lg:p-8 flex flex-col items-center justify-center text-center transition-all hover:brightness-110 cursor-default">
                <span
                  className="material-symbols-outlined text-5xl mb-6 text-[#080e1c]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <h4 className="text-[10px] font-black text-[#080e1c] uppercase tracking-[0.2em]">
                  Hasil Terpercaya
                </h4>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 px-4 sm:px-6 md:px-16">
          <div className="max-w-7xl mx-auto glass-card border border-[#8ff5ff]/10 p-6 sm:p-10 md:p-16 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#8ff5ff]/5 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-[#8ff5ff]/3 blur-[120px] rounded-full pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
              {/* Left: Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#8ff5ff]/5 border border-[#8ff5ff]/20 rounded-full mb-8">
                  <span className="w-2 h-2 rounded-full bg-[#8ff5ff] pulse-dot" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#8ff5ff] font-bold">Siap Digunakan</span>
                </span>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif-accent text-white mb-8 tracking-tight glow-text">
                  Mulai Verifikasi Sekarang
                </h3>
                <p className="text-lg text-[#e3e7fc]/70 mb-12 leading-relaxed font-normal max-w-lg mx-auto lg:mx-0">
                  Pastikan keaslian dokumen akademik Anda dari Universitas Negeri Yogyakarta.
                  Cukup unggah file PDF dan dapatkan hasil verifikasi dalam hitungan detik.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-center justify-center lg:justify-start">
                  <Link
                    href="/verify"
                    className="min-h-12 bg-[#8ff5ff] text-[#080e1c] px-6 sm:px-10 py-5 text-xs sm:text-sm font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] hover:bg-[#b3faff] transition-all active:scale-95 w-full sm:w-auto text-center shadow-[0_0_30px_rgba(143,245,255,0.2)]"
                  >
                    Verifikasi Dokumen
                  </Link>
                  <Link
                    href="/admin/login"
                    className="text-white text-sm font-black uppercase tracking-[0.2em] border-b-2 border-[#8ff5ff] pb-1 hover:text-[#8ff5ff] transition-colors w-full sm:w-auto text-center sm:text-left"
                  >
                    Login sebagai Admin
                  </Link>
                </div>
              </div>
              {/* Right: Hero Illustration */}
              <div className="w-full lg:w-5/12 mt-4 lg:mt-0 flex-shrink-0">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-[#8ff5ff]/[0.06] blur-[60px] rounded-full group-hover:bg-[#8ff5ff]/[0.1] transition-all duration-1000 pointer-events-none" />
                  <Image
                    src="/images/hero-verification.png"
                    alt="Ilustrasi sistem verifikasi dokumen akademik DocuVerify UNY — menampilkan laptop dengan antarmuka verifikasi, jaringan IPFS, dan QR Code"
                    width={600}
                    height={600}
                    className="relative w-full h-auto drop-shadow-[0_0_40px_rgba(143,245,255,0.08)] group-hover:scale-[1.02] transition-transform duration-700"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-[#080e1c] border-t border-[#424858]/15">
        <div className="flex flex-col lg:flex-row justify-between items-center px-6 md:px-12 w-full font-headline text-[10px] uppercase tracking-[0.3em] gap-8 lg:gap-0 text-center lg:text-left">
          <div className="text-[#e3e7fc]/40">
            © {new Date().getFullYear()} DocuVerify UNY •{" "}
            <span className="text-[#8ff5ff]">Universitas Negeri Yogyakarta</span>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-12 items-center">
            <Link className="text-[#e3e7fc]/40 hover:text-[#8ff5ff] transition-all duration-300" href="/verify">
              Verifikasi
            </Link>
            <Link className="text-[#e3e7fc]/40 hover:text-[#8ff5ff] transition-all duration-300" href="/admin/login">
              Login Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
