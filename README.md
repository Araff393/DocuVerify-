# DocuVerify UNY — Sistem Verifikasi Keaslian Dokumen Akademik

> **Sistem Verifikasi Keaslian Dokumen Akademik Universitas Negeri Yogyakarta Berbasis IPFS CID**

Project Mandiri / Skripsi yang membangun aplikasi web untuk verifikasi keaslian dokumen akademik UNY menggunakan **hash kriptografis SHA-256** sebagai simulasi dari **IPFS Content Identifier (CID)**.

---

## Daftar Isi

1. [Deskripsi & Tujuan](#1-deskripsi--tujuan)
2. [Konsep Utama](#2-konsep-utama-foundational-concepts)
3. [Aktor & Fitur](#3-aktor--fitur)
4. [Teknologi (Stack)](#4-teknologi-stack)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Komponen Sistem](#6-komponen-sistem)
7. [Metode / Algoritma](#7-metode--algoritma)
8. [Data & Schema](#8-data--schema-database)
9. [Validasi & Keamanan](#9-validasi--keamanan)
10. [Struktur Folder](#10-struktur-folder)
11. [Environment Variable](#11-environment-variable)
12. [Cara Menjalankan](#12-cara-menjalankan)
13. [Pengujian](#13-pengujian)
14. [Folder `_legacy/`](#14-folder-_legacy)
15. [Catatan Akademik](#15-catatan-akademik)
16. [Roadmap Pengembangan](#16-roadmap-pengembangan)

---

## 1. Deskripsi & Tujuan

### 1.1 Deskripsi Sistem

DocuVerify UNY adalah prototype aplikasi web yang dirancang untuk memverifikasi keaslian dokumen akademik dalam lingkup **Universitas Negeri Yogyakarta (UNY)**. Sistem bekerja dengan menghasilkan **sidik jari digital** (identitas unik) dari setiap dokumen yang didaftarkan menggunakan algoritma hash kriptografis **SHA-256** sebagai simulasi konsep **IPFS Content Identifier (CID)**.

Ketika ada pihak yang ingin memeriksa keaslian dokumen, cukup dengan mengunggah file PDF — sistem secara otomatis menghitung hash dan membandingkannya dengan data yang tersimpan:

| Hasil | Kondisi |
|---|---|
| ✅ **VALID** | Hash cocok dan dokumen aktif (`ACTIVE`) |
| ⚠️ **NOT_REGISTERED** | Hash tidak ditemukan (file belum pernah didaftarkan) |
| ❌ **INVALID** | Hash cocok tapi dokumen sudah dicabut (`REVOKED`) |

### 1.2 Latar Belakang

Dokumen akademik (skripsi, lembar pengesahan, surat akademik) memiliki nilai penting untuk administrasi, kelulusan, dan pembuktian capaian akademik. Dokumen digital sangat mudah didistribusikan, namun juga rentan dimodifikasi atau dipalsukan tanpa mekanisme verifikasi yang jelas. Sistem ini dibangun sebagai alternatif verifikasi berbasis hash kriptografis dan pendekatan *content addressing*.

### 1.3 Tujuan

1. Membangun prototype aplikasi web untuk pendaftaran dan verifikasi dokumen akademik UNY.
2. Menghasilkan identitas digital unik dari dokumen PDF menggunakan SHA-256 sebagai simulasi CID IPFS.
3. Menyimpan metadata dokumen dan hash asli ke database.
4. Menyediakan mekanisme verifikasi otomatis melalui perbandingan hash.
5. Menampilkan hasil verifikasi secara jelas dan mudah dipahami.
6. Menjadi dasar implementasi untuk penelitian skripsi terkait keamanan dan keaslian dokumen digital.

### 1.4 Batasan Masalah

1. Lingkup institusi dibatasi pada **Universitas Negeri Yogyakarta**.
2. Format dokumen yang didukung hanya **PDF**.
3. Sistem **tidak** melakukan OCR atau pemeriksaan isi teks dokumen.
4. Sistem **tidak** menentukan validitas hukum dokumen.
5. Sistem **tidak** terhubung langsung dengan sistem akademik resmi UNY.
6. Integrasi blockchain dan IPFS digunakan sebagai lapisan bonus, bukan sistem produksi final.

### 1.5 Jenis Dokumen yang Didukung

| No | Jenis Dokumen |
| :---: | :--- |
| 1 | Sertifikat Akademik |
| 2 | Sertifikat Lainnya |

---

## 2. Konsep Utama (Foundational Concepts)

### 2.1 Hash Kriptografis & SHA-256

Fungsi matematis satu arah yang memetakan input data berukuran bebas menjadi output dengan panjang tetap (*digest*). Tiga properti yang dimanfaatkan:

- **Deterministik** — input identik → hash identik.
- **Avalanche effect** — perubahan 1 bit pada input → hash berbeda total.
- **Pre-image resistance** — secara komputasional tidak mungkin merekonstruksi input dari hash.

**SHA-256** menghasilkan digest 256 bit (= 32 byte = 64 karakter heksadesimal). Implementasi:
- Server-side: `node:crypto.createHash("sha256")` di [`lib/upload.ts`](./lib/upload.ts)
- Client-side: `crypto.subtle.digest("SHA-256")` (Web Crypto API) di [`lib/hash.ts`](./lib/hash.ts)

### 2.2 Content Identifier (CID) & IPFS

**IPFS (InterPlanetary File System)** adalah jaringan penyimpanan terdistribusi yang menggunakan *content addressing* — file diakses berdasarkan isinya, bukan lokasinya. **CID** adalah identitas unik file di IPFS, diturunkan dari hash isinya.

Pada MVP, sistem menggunakan **SHA-256 sebagai simulasi CID** agar fokus penelitian berada pada logika verifikasi tanpa kerumitan infrastruktur IPFS langsung. Layer IPFS asli (via Pinata) sudah disiapkan sebagai bonus — aktif jika `PINATA_JWT` diisi.

### 2.3 Verifikasi Berbasis Hash

Metode pembuktian keaslian dengan membandingkan hash file yang diuji terhadap hash yang tersimpan. Tiga kemungkinan hasil sesuai matriks pada §1.1.

### 2.4 Authentication & Authorization

- **bcrypt** — algoritma adaptif untuk hash password dengan *cost factor* (10 rounds di sistem ini, ~100ms/hash). Setiap hash mengandung *salt* otomatis.
- **JWT (JSON Web Token)** — token bertanda tangan berisi payload (`adminId`, `email`, `name`). Algoritma **HS256** dengan secret simetris (`AUTH_SECRET`).
- **Session via httpOnly cookie** — token JWT disimpan di cookie `docuverify_session` dengan flag `httpOnly`, `sameSite=lax`, `secure` (di production), expiry 7 hari.

### 2.5 Soft Delete

Pola menghapus data secara logis tanpa menghapus baris fisik. Sistem mengubah `status` dokumen dari `ACTIVE` → `REVOKED` untuk menjaga audit trail. Dokumen REVOKED yang diverifikasi → status `INVALID`.

### 2.6 Object-Relational Mapping (ORM)

Lapisan abstraksi yang memetakan tabel database ke objek bahasa pemrograman. Sistem memakai **Prisma ORM** dengan generated TypeScript client — tipe schema otomatis tersedia di kode.

### 2.7 Pinata IPFS Pinning Service

Layanan pihak ketiga untuk mem-*pin* file ke jaringan IPFS sehingga tetap tersedia. Diakses via Pinata SDK resmi dengan JWT auth. Sistem memakai pola **strict + safe variant** — kegagalan IPFS tidak menggagalkan registrasi dokumen.

### 2.8 Blockchain & Smart Contract (legacy)

Lapisan bonus yang sudah dipindah ke `_legacy/`:
- **Ethereum** — ledger immutable terdesentralisasi.
- **Smart contract** — `contracts/CertificateRegistry.sol` mendefinisikan kontrak penyimpanan hash.
- **Sepolia testnet** — jaringan uji Ethereum gratis.
- **Hardhat** — environment development Solidity.

---

## 3. Aktor & Fitur

### 3.1 Admin Institusi

Pihak internal UNY yang berwenang mendaftarkan dokumen asli ke dalam sistem.

| No | Kemampuan |
| :---: | :--- |
| 1 | Login ke dashboard admin |
| 2 | Mengunggah dokumen PDF |
| 3 | Mengisi metadata dokumen (judul, NIM, fakultas, prodi, tahun) |
| 4 | Melihat daftar dokumen terdaftar dengan filter (jenis, fakultas, status) |
| 5 | Melihat detail dokumen beserta hash kriptografis & IPFS CID |
| 6 | Mencabut (revoke) dokumen yang tidak berlaku |
| 7 | Memantau riwayat verifikasi lengkap (termasuk IP pemohon) |
| 8 | Melihat audit log aksi penting admin |
| 9 | Mengubah password akun admin |
| 10 | Logout aman melalui endpoint POST ber-CSRF |

### 3.2 Pengguna Umum / Verifikator

Pihak manapun yang ingin memeriksa keaslian dokumen akademik.

| No | Kemampuan |
| :---: | :--- |
| 1 | Mengakses halaman verifikasi publik tanpa login |
| 2 | Mengunggah dokumen PDF untuk diverifikasi |
| 3 | Melihat hasil verifikasi beserta detail dokumen (jika valid) |
| 4 | Melihat riwayat verifikasi publik (50 terbaru) |

### 3.3 Daftar Fitur

| No | Fitur | Keterangan |
| :---: | :--- | :--- |
| 1 | Landing Page | Halaman utama dengan deskripsi sistem, alur verifikasi, navigasi |
| 2 | Halaman Verifikasi Publik | Form upload PDF + tampilan hasil 3-state |
| 3 | Login Admin | Autentikasi via email + password (bcrypt + JWT cookie) |
| 4 | Dashboard Admin | Statistik total dokumen, total verifikasi, valid, tidak terdaftar |
| 5 | Pendaftaran Dokumen | Form lengkap untuk mendaftarkan dokumen akademik baru |
| 6 | Daftar Dokumen | Tabel dengan pencarian dan filter jenis/fakultas/status |
| 7 | Detail Dokumen | Metadata, hash SHA-256, IPFS CID, QR code, riwayat verifikasi |
| 8 | Pencabutan Dokumen | Soft delete — ubah status ke `REVOKED` |
| 9 | Riwayat Verifikasi | Log seluruh percobaan verifikasi beserta status & IP |
| 10 | Validasi File PDF | Pembatasan format & ukuran (≤ 10 MB) |
| 11 | Hash SHA-256 | Sidik jari digital otomatis sebagai simulasi CID |
| 12 | Upload IPFS (Bonus) | Auto-upload ke Pinata jika `PINATA_JWT` di-set |
| 13 | Audit Log Admin | Mencatat pendaftaran, pencabutan, ubah password, dan logout |
| 14 | Ubah Password Admin | Form akun admin dengan validasi password lama + password baru |
| 15 | QR Code Valid | QR detail dokumen dibuat dengan library `qrcode` yang spec-compliant |

---

## 4. Teknologi (Stack)

### 4.1 Bahasa & Runtime

| Teknologi | Versi | Definisi |
| :--- | :---: | :--- |
| **TypeScript** | ^5.8.2 | Superset JavaScript dengan static typing |
| **Node.js** | ≥18 | JS runtime di server (eksekusi API routes, Prisma, hashing) |

### 4.2 Framework

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Next.js (App Router)** | ^15.2.4 | Framework fullstack (frontend + API routes built-in) |
| **React** | ^19.0.0 | Library UI deklaratif |
| **React Server Components** | bawaan | Komponen server-rendered tanpa kirim JS ke client |
| **Edge Runtime** | bawaan | V8 isolate ringan untuk middleware (verifikasi JWT) |

### 4.3 Styling

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Tailwind CSS** | ^3.4.17 | Utility-first CSS framework |
| **PostCSS + Autoprefixer** | - | Vendor prefix otomatis |
| **Material Symbols Outlined** | Google Fonts | Icon set vector |
| **Syne / Outfit / DM Serif / JetBrains Mono** | Google Fonts | Tipografi |

### 4.4 Database & ORM

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Supabase PostgreSQL** | managed | RDBMS cloud untuk deployment/hosting |
| **Prisma ORM** | ^6.19.3 | Schema declarative, migrasi, type-safe client |

### 4.5 Validasi & Keamanan

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Zod** | ^3.24.2 | Validasi schema TypeScript-first (runtime + tipe statik) |
| **bcryptjs** | ^3.0.3 | Hash password admin (10 rounds) |
| **jose** | ^6.2.3 | Sign & verify JWT (Edge-compatible) |
| **server-only** | ^0.0.1 | Marker package; cegah modul server di-import dari client |
| **qrcode** | ^1.5.4 | Membuat QR Code valid/spec-compliant pada detail dokumen |

### 4.6 Bonus Stack (Opsional)

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Pinata SDK** | ^2.5.6 | Upload file PDF berbasis IPFS (auto-upload jika `PINATA_JWT` di-set) |
| **Ethers.js** | ^6.14.3 | Interaksi Ethereum smart contract *(legacy, di `_legacy/`)* |
| **Hardhat** | ^2.24.1 | Development environment Solidity |
| **Solidity** | via Hardhat | Bahasa smart contract (`CertificateRegistry.sol`) |

### 4.7 Tooling Test

| Teknologi | Versi | Fungsi |
| :--- | :---: | :--- |
| **Vitest** | ^2.1.8 | Test runner cepat untuk integration test API MVP |
| **dotenv-cli** | ^11.0.0 | Loader file `.env` untuk script CLI |
| **tsx** | ^4.19.3 | Runner TypeScript (dipakai untuk seed) |

---

## 5. Arsitektur Sistem

```text
┌─────────────────────────────────────────────────────────────────┐
│                     PENGGUNA / ADMIN                            │
│         (Browser — http://localhost:3000)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NEXT.JS APP ROUTER                              │
│                                                                 │
│   ┌─────────────────────────┐  ┌──────────────────────────────┐ │
│   │   HALAMAN PUBLIK        │  │   HALAMAN ADMIN (Protected)  │ │
│   │                         │  │                              │ │
│   │  /          Landing     │  │  /admin/login      Login     │ │
│   │  /verify    Verifikasi  │  │  /admin/dashboard  Dashboard │ │
│   │  /history   Riwayat     │  │  /admin/documents  Daftar    │ │
│   │                         │  │  /admin/documents/create     │ │
│   │                         │  │  /admin/documents/[id]       │ │
│   │                         │  │  /admin/verifications        │ │
│   └─────────────────────────┘  └──────────────────────────────┘ │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    API ROUTES                           │   │
│   │                                                         │   │
│   │  /api/auth/{login,logout,me,csrf,change-password}       │   │
│   │                                Autentikasi admin         │   │
│   │  /api/documents                 GET (list) / POST       │   │
│   │  /api/documents/[id]            GET / DELETE (revoke)   │   │
│   │  /api/documents/[id]/file       Stream PDF (admin only) │   │
│   │  /api/audit-logs                Audit log admin         │   │
│   │  /api/verify                    Verifikasi publik       │   │
│   │  /api/verifications             Riwayat (public/admin)  │   │
│   │  /api/dashboard/stats           Statistik (admin only)  │   │
│   └────────────┬────────────────┬───────────────────────────┘   │
│                │                │                               │
│   middleware.ts (Edge runtime, jose JWT verify) protect /admin/*│
└────────────────┼────────────────┼───────────────────────────────┘
                 │                │
                 ▼                ▼
   ┌──────────────────┐   ┌─────────────────────────┐
   │ Supabase + Prisma│   │  Pinata IPFS (Bonus)    │
   │ PostgreSQL cloud │   │  Ethereum Sepolia       │
   │  uploads/*.pdf   │   │  (Blockchain di _legacy)│
   └──────────────────┘   └─────────────────────────┘
```

---

## 6. Komponen Sistem

### 6.1 Halaman Publik

| Route | File | Tipe | Deskripsi |
|---|---|---|---|
| `/` | `app/page.tsx` | Server | Landing page dengan deskripsi sistem |
| `/verify` | `app/verify/page.tsx` | Server | Form upload PDF + hasil verifikasi |
| `/history` | `app/history/page.tsx` | Server | 50 riwayat verifikasi terbaru (publik) |

### 6.2 Halaman Admin (Protected)

| Route | File | Tipe | Deskripsi |
|---|---|---|---|
| `/admin/login` | `app/admin/login/page.tsx` | Client | Form login |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Server | Statistik agregat |
| `/admin/documents` | `app/admin/documents/page.tsx` | Server | Tabel + search/filter |
| `/admin/documents/create` | `app/admin/documents/create/page.tsx` | Client | Form pendaftaran |
| `/admin/documents/[id]` | `app/admin/documents/[id]/page.tsx` | Server | Detail + verifikasi terbaru |
| `/admin/documents/[id]/document-actions.tsx` | (komponen) | Client | QR + revoke + download |
| `/admin/verifications` | `app/admin/verifications/page.tsx` | Server | Log lengkap admin |
| `/admin/audit-logs` | `app/admin/audit-logs/page.tsx` | Server | Audit log aksi admin + filter action |
| `/admin/account` | `app/admin/account/page.tsx` | Client | Form ubah password admin |

### 6.3 API Routes

| Endpoint | Method | Akses | Fungsi |
|---|---|---|---|
| `/api/auth/login` | POST | Publik | Validasi kredensial → set cookie session |
| `/api/auth/csrf` | GET | Admin | Ambil token CSRF untuk request mutasi admin |
| `/api/auth/change-password` | POST | Admin | Ubah password admin aktif (wajib CSRF) |
| `/api/auth/logout` | POST | Admin | Hapus cookie session + audit log (wajib CSRF) |
| `/api/auth/me` | GET | Admin | Profil admin yang login |
| `/api/audit-logs` | GET | Admin | List audit log dengan pagination dan filter action |
| `/api/documents` | GET | Admin | List dokumen (search, filter) |
| `/api/documents` | POST | Admin | Daftarkan dokumen baru (FormData + PDF) |
| `/api/documents/[id]` | GET | Admin | Detail + 10 verifikasi terakhir |
| `/api/documents/[id]` | DELETE | Admin | Soft delete (`status` → `REVOKED`) |
| `/api/documents/[id]/file` | GET | Admin | Stream PDF (inline / download) |
| `/api/verify` | POST | Publik | Hitung hash → cocokkan → log → return result |
| `/api/verifications` | GET | Publik / Admin | Riwayat (`?scope=public|admin`) |
| `/api/dashboard/stats` | GET | Admin | Statistik agregat |

### 6.4 Komponen UI (`components/`)

| File | Fungsi |
|---|---|
| `navigation.tsx` | Navbar publik |
| `admin-layout.tsx` | Wrapper layout admin |
| `admin-sidebar.tsx` | Sidebar navigasi admin + logout aman via API |
| `verify-form.tsx` | Form verifikasi + tampilan hasil 3-state |
| `section-card.tsx`, `empty-state.tsx` | Komponen reusable |

### 6.5 Library Utility (`lib/`)

| File | Tanggung Jawab |
|---|---|
| `db.ts` | Singleton `PrismaClient` (cegah multiple instance saat hot-reload) |
| `auth.ts` | `hashPassword`, `verifyPassword`, `createSession`, `getSession`, `destroySession`, `requireAdmin` |
| `audit.ts` | Helper audit action dan penulisan `AdminAuditLog` |
| `csrf.ts`, `client-csrf.ts` | Token CSRF server/client untuk mutasi admin |
| `upload.ts` | Validasi PDF server-side, magic bytes, SHA-256 buffer, simpan/hapus file |
| `hash.ts` | `computeSHA256` (client-side via Web Crypto API) |
| `validation.ts` | Zod schema: `registerDocumentSchema`, `loginSchema` |
| `rate-limit.ts` | Rate limit in-memory untuk login dan verifikasi publik |
| `constants.ts` | `documentTypeList`, `facultyList`, `FILE_MAX_MB`, `SESSION_COOKIE_NAME` |
| `types.ts` | Type domain (`DocumentType`, `Faculty`, `VerificationStatus`, dll) |
| `errors.ts` | `AppError` class + `toAppError` adapter |
| `env.ts` | `getServerEnv`, `isPinataConfigured`, `isBlockchainConfigured` |
| `pinata.ts` | Wrapper Pinata SDK (strict + safe variants) |

### 6.6 Middleware (`middleware.ts`)

Eksekusi di Edge runtime sebelum request mencapai halaman:
1. Path `/admin/login` + sudah login → redirect ke dashboard.
2. Path `/admin/*` + belum login → redirect ke login dengan `?redirect=...`.
3. Verifikasi JWT memakai `jose.jwtVerify()` (Edge-compatible — Prisma & bcryptjs tidak bisa di Edge).

---

## 7. Metode / Algoritma

### 7.1 Pendaftaran Dokumen (Admin)

```text
Admin login → cookie JWT terpasang
        │
        ▼
POST /api/documents (FormData: metadata + PDF)
        │
        ├─ requireAdmin()                     [otorisasi]
        ├─ assertPdfFile(file)                [tipe + size ≤ 10MB]
        ├─ Zod validate metadata              [title, faculty, year, dll]
        ├─ SHA256(file) di server-side        [authoritative]
        ├─ saveUploadedFile() ke /uploads/    [sanitize name + unique path]
        ├─ tryUploadPdfToPinata() [bonus]     [best-effort, gagal = lanjut]
        └─ prisma.document.create({...})
              │
              ├─ Sukses → return 201 { document }
              └─ P2002 → rollback file + return 409 (duplicate hash)
```

### 7.2 Verifikasi Dokumen (Publik)

```text
POST /api/verify (FormData: PDF)
        │
        ├─ assertPdfFile(file)
        ├─ SHA256(file)
        ├─ prisma.document.findUnique({ where: { hashSHA256 } })
        ├─ Tentukan status:
        │     • !match              → "NOT_REGISTERED"
        │     • match + REVOKED     → "INVALID"
        │     • match + ACTIVE      → "VALID"
        ├─ Ambil IP dari header (x-forwarded-for / x-real-ip)
        ├─ prisma.verificationLog.create({...})
        └─ Return { status, message, uploadedHash, referenceHash?, document? }

CATATAN: File yang diverifikasi TIDAK disimpan permanen.
```

### 7.3 Autentikasi Admin

```text
POST /api/auth/login { email, password }
        │
        ├─ loginSchema.parse(body)            [Zod normalize lowercase]
        ├─ prisma.admin.findUnique({ email })
        ├─ bcrypt.compare(password, hash)
        ├─ createSession({ adminId, email, name })
        │     ├─ SignJWT(payload).setProtectedHeader({alg:"HS256"})
        │     │     .setExpirationTime("604800s").sign(secret)
        │     └─ cookies().set("docuverify_session", token, {
        │           httpOnly, secure (prod), sameSite:"lax", maxAge: 7*24*3600
        │         })
        └─ Return { admin: { id, name, email } }
```

### 7.4 Soft Revoke

```text
DELETE /api/documents/[id]
        │
        ├─ requireAdmin()
        ├─ prisma.document.findUnique({ where: { id } })
        ├─ prisma.document.update({ where: { id }, data: { status: "REVOKED" } })
        └─ Return { document }

EFEK: Verifikasi dokumen REVOKED → status "INVALID".
       Baris tetap ada untuk audit trail.
```

### 7.5 Path Traversal Protection

`resolveUploadPath()` di [`lib/upload.ts`](./lib/upload.ts):
```text
1. path.normalize(relativePath)
2. Strip leading slashes
3. Reject jika string mengandung '..' atau diawali '..'
4. path.join(process.cwd(), normalized)
```

### 7.6 Sanitasi Nama File

`sanitizeFileName()` di [`lib/upload.ts`](./lib/upload.ts):
```text
1. path.basename(name)             // buang path separator
2. replace [^a-zA-Z0-9._-] → '_'
3. slice(0, 100)                   // batasi panjang
```

### 7.7 Pseudocode Verifikasi (Formal)

```text
FUNGSI verifikasi(file_upload):
    JIKA NOT isPDF(file_upload) OR size(file_upload) > 10MB:
        RETURN error("invalid_file")

    hash_upload ← SHA256(file_upload)
    dokumen ← Document.findUnique(hashSHA256 = hash_upload)

    JIKA dokumen IS NULL:
        status ← "NOT_REGISTERED"
    SEBALIKNYA JIKA dokumen.status == "REVOKED":
        status ← "INVALID"
    SEBALIKNYA:
        status ← "VALID"

    VerificationLog.create(uploadedHash, status, dokumen?.id, ipAddress)
    RETURN { status, hash_upload, hash_referensi: dokumen?.hashSHA256, dokumen }
```

---

## 8. Data & Schema (Database)

Sistem menggunakan **4 model utama** di Prisma schema. File: [`prisma/schema.prisma`](./prisma/schema.prisma).

### 8.1 Model `Admin`

Menyimpan data administrator untuk autentikasi.

| Field | Tipe | Constraint | Definisi |
| :--- | :--- | :--- | :--- |
| `id` | Int | PK, autoincrement | Identitas unik admin |
| `name` | String | required | Nama lengkap admin |
| `email` | String | unique | Email login (Zod `.toLowerCase()`) |
| `passwordHash` | String | required | Hash bcrypt 10 rounds (**bukan** plaintext) |
| `createdAt` | DateTime | default(now) | Timestamp pembuatan akun |
| `updatedAt` | DateTime | @updatedAt | Auto-update saat record berubah |

Relasi:
- `auditLogs` → daftar `AdminAuditLog` milik admin.

### 8.2 Model `Document`

Menyimpan metadata lengkap dokumen akademik beserta hash kriptografis.

| Field | Tipe | Constraint | Definisi |
| :--- | :--- | :--- | :--- |
| `id` | Int | PK, autoincrement | Primary key |
| `title` | String | required | Judul dokumen |
| `documentType` | String | required, indexed | `Sertifikat Akademik` atau `Sertifikat Lainnya` |
| `ownerName` | String | required | Nama pemilik |
| `ownerIdentity` | String | required | NIM |
| `faculty` | String | required, indexed | Salah satu dari 9 fakultas UNY |
| `studyProgram` | String | required | Program studi |
| `documentYear` | Int | 2000–2099 | Tahun dokumen |
| `institution` | String | default "Universitas Negeri Yogyakarta" | Konstanta institusi |
| `fileName` | String | required | Nama asli file (display) |
| `filePath` | String | required | Path relatif (`uploads/{ts}-{hash8}-{name}.pdf`) |
| `hashSHA256` | String | **unique**, indexed | **Sidik jari digital** (64 hex) |
| `ipfsCid` | String? | optional | CID IPFS dari Pinata (bonus) |
| `ipfsFileId` | String? | optional | ID file di Pinata (untuk operasi unpin) |
| `status` | String | default "ACTIVE", indexed | `ACTIVE` atau `REVOKED` |
| `createdAt` | DateTime | default(now), indexed | Timestamp pendaftaran |
| `updatedAt` | DateTime | @updatedAt | Auto-update |

### 8.3 Model `VerificationLog`

Menyimpan riwayat setiap percobaan verifikasi oleh pengguna publik.

| Field | Tipe | Constraint | Definisi |
| :--- | :--- | :--- | :--- |
| `id` | Int | PK, autoincrement | ID log |
| `uploadedHash` | String | required | Hash SHA-256 dari file user |
| `status` | String | indexed | `VALID` / `NOT_REGISTERED` / `INVALID` |
| `documentId` | Int? | FK → Document.id, indexed | Null jika tidak match. `onDelete: SetNull` |
| `document` | Document? | relation | Optional relation |
| `ipAddress` | String? | optional | IP pemohon (audit, hanya admin) |
| `createdAt` | DateTime | default(now), indexed | Waktu verifikasi |

### 8.4 Model `AdminAuditLog`

Menyimpan jejak aksi penting admin.

| Field | Tipe | Constraint | Definisi |
| :--- | :--- | :--- | :--- |
| `id` | Int | PK, autoincrement | ID audit log |
| `adminId` | Int | FK → Admin.id, indexed | Admin pelaku aksi |
| `action` | String | indexed | `DOCUMENT_CREATED`, `DOCUMENT_REVOKED`, `PASSWORD_CHANGED`, `LOGOUT` |
| `targetType` | String? | optional | Entitas target, misalnya `Document` / `Admin` |
| `targetId` | String? | optional | ID target dalam bentuk string |
| `metadata` | String? | optional | JSON string ringkas untuk konteks aksi |
| `ipAddress` | String? | optional | IP request admin |
| `createdAt` | DateTime | default(now), indexed | Waktu aksi |

### 8.5 Relasi

```text
Document  ──── 1 : N ────  VerificationLog
   (Satu dokumen bisa memiliki banyak riwayat verifikasi)

Admin     ──── 1 : N ────  AdminAuditLog
   (Satu admin bisa memiliki banyak catatan audit)
```

### 8.6 Status Verifikasi

| Status Internal | Tampilan ke Pengguna | Kondisi |
| :--- | :--- | :--- |
| `VALID` | ✅ Dokumen Valid / Terverifikasi | Hash ditemukan & dokumen `ACTIVE` |
| `NOT_REGISTERED` | ⚠️ Dokumen Tidak Terdaftar | Hash tidak ditemukan |
| `INVALID` | ❌ Dokumen Tidak Valid | Hash ditemukan tapi `REVOKED` |

### 8.7 Format Hash

- Panjang: **64 karakter heksadesimal**
- Charset: `[0-9a-f]`
- Contoh: `a3f2c8e91d4b7f6a0e5c3d2b1a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1`

---

## 9. Validasi & Keamanan

### 9.1 Validasi Upload File

| Aturan | Nilai |
| :--- | :--- |
| Format file | Hanya PDF (`application/pdf` MIME atau `.pdf` ekstensi) |
| Magic bytes | Buffer file harus diawali `%PDF-` |
| Ukuran maksimal | 10 MB (dapat diubah via `FILE_MAX_MB` di `lib/constants.ts`) |
| Sanitasi nama file | Replace karakter non-alphanumeric ke `_`, max 100 char |
| File dari admin | Disimpan ke `uploads/` (di luar `public/`, hanya bisa diakses via API beraut) |
| File dari verifikator | TIDAK disimpan permanen — hanya diproses untuk hitung hash |

### 9.2 Pemetaan Konsep Keamanan ↔ Implementasi

| Konsep akademik | Implementasi konkret |
|---|---|
| Cryptographic hash (SHA-256) | `crypto.createHash("sha256")` di [`lib/upload.ts`](./lib/upload.ts) |
| Content addressing (IPFS CID) | Field `hashSHA256` (simulasi) + `ipfsCid` (asli, via Pinata) |
| Avalanche effect | Properti algoritma SHA-256 (tidak butuh kode) |
| Pre-image resistance | Properti SHA-256 |
| Soft delete | `Document.status` = `REVOKED` |
| Audit trail | Tabel `VerificationLog` dengan `ipAddress` + `createdAt` |
| Audit admin | Tabel `AdminAuditLog` untuk aksi dokumen, password, dan logout |
| Authentication | bcrypt + JWT cookie (`lib/auth.ts`) |
| Authorization | `requireAdmin()` di setiap API admin + middleware untuk halaman admin |
| CSRF protection | Mutasi admin wajib header/cookie CSRF |
| Rate limiting | Login dan verifikasi publik dibatasi in-memory |
| Input validation | Zod schemas di `lib/validation.ts` |
| Path traversal protection | `resolveUploadPath()` |
| Race condition mitigation | Unique constraint `hashSHA256` + tangkap Prisma `P2002` |
| File integrity | Hash dihitung ulang server-side (authoritative) |
| Stateless session | JWT signed (vs server-side session storage) |

---

## 10. Struktur Folder

```text
PROJECT/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Landing page (publik)
│   ├── layout.tsx                    # Root layout + font config
│   ├── globals.css                   # Global styles + design system
│   ├── verify/
│   │   └── page.tsx                  # Halaman verifikasi (publik)
│   ├── history/
│   │   └── page.tsx                  # Riwayat verifikasi publik (Server Component)
│   ├── admin/
│   │   ├── login/page.tsx            # Login admin
│   │   ├── account/page.tsx          # Ubah password admin
│   │   ├── audit-logs/page.tsx       # Audit log admin
│   │   ├── dashboard/page.tsx        # Dashboard statistik (Server Component)
│   │   ├── documents/
│   │   │   ├── page.tsx              # Daftar dokumen (Server Component)
│   │   │   ├── create/page.tsx       # Form pendaftaran (Client Component)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detail dokumen (Server Component)
│   │   │       └── document-actions.tsx  # QR + revoke (Client Component)
│   │   └── verifications/page.tsx    # Riwayat verifikasi admin
│   └── api/
│       ├── auth/{login,logout,me,csrf,change-password}/
│       │                              # Autentikasi admin + CSRF + password
│       ├── audit-logs/               # Audit log admin
│       ├── documents/                # CRUD dokumen
│       │   ├── route.ts              # GET (list) + POST (create)
│       │   └── [id]/
│       │       ├── route.ts          # GET (detail) + DELETE (revoke)
│       │       └── file/route.ts     # Stream PDF
│       ├── verify/route.ts           # POST verifikasi publik
│       ├── verifications/route.ts    # GET riwayat (public/admin scope)
│       └── dashboard/stats/route.ts  # GET statistik
│
├── components/                       # Reusable UI components
│   ├── navigation.tsx                # Navbar publik
│   ├── admin-layout.tsx              # Layout wrapper admin
│   ├── admin-sidebar.tsx             # Sidebar navigasi admin
│   ├── verify-form.tsx               # Form verifikasi + hasil
│   ├── section-card.tsx              # Card section reusable
│   └── empty-state.tsx               # State kosong/empty
│
├── lib/                              # Utility libraries (server-side)
│   ├── db.ts                         # Singleton Prisma Client
│   ├── auth.ts                       # bcrypt + JWT session
│   ├── audit.ts                      # AdminAuditLog helper
│   ├── csrf.ts / client-csrf.ts      # CSRF server/client
│   ├── rate-limit.ts                 # Rate limit in-memory
│   ├── upload.ts                     # File upload + SHA-256 + path-traversal guard
│   ├── hash.ts                       # Client-side SHA-256 (Web Crypto)
│   ├── validation.ts                 # Zod schemas
│   ├── constants.ts                  # documentTypeList, facultyList, FILE_MAX, dll
│   ├── types.ts                      # Domain types (DocumentType, Faculty, dll)
│   ├── errors.ts                     # AppError class + toAppError
│   ├── env.ts                        # Env helpers (isPinataConfigured, dll)
│   └── pinata.ts                     # Pinata SDK wrapper (strict + safe variants)
│
├── prisma/
│   ├── schema.prisma                 # Schema PostgreSQL via Prisma
│   ├── seed.ts                       # Seed admin default + 8 dokumen contoh
│   └── dev.db                        # SQLite legacy source untuk migrasi awal
│
├── uploads/                          # File PDF tersimpan (gitignored, bukan public/)
│
├── _legacy/                          # Arsip kode lama (lihat _legacy/README.md)
│   ├── app/{register, api/certificates}/
│   ├── components/{register-form, history-table, internal-layout, sidebar}.tsx
│   └── lib/{blockchain, contract, format, mock-data}.ts
│
├── tests/                            # Integration tests (Vitest) — opsional
│   ├── global-setup.ts               # Setup integration tests
│   ├── setup.ts                      # Mock next/headers, clean tables per test
│   └── helpers.ts                    # Helper bikin admin/dokumen/PDF/Request
│
├── contracts/                        # Solidity smart contracts (bonus)
│   └── CertificateRegistry.sol
├── scripts/                          # Hardhat deployment scripts
├── test/                             # Hardhat smart contract tests (bukan tests/)
├── public/                           # Static assets
│
├── middleware.ts                     # Edge middleware: protect /admin/*
├── hardhat.config.ts                 # Konfigurasi Hardhat
├── tailwind.config.ts                # Konfigurasi Tailwind CSS
├── tsconfig.json                     # Konfigurasi TypeScript (exclude _legacy)
├── next.config.ts                    # Konfigurasi Next.js
├── vitest.config.ts                  # Konfigurasi Vitest (untuk integration tests)
├── package.json                      # Dependencies & scripts
├── .env.example                      # Template environment variable
├── .env.test                         # Env untuk integration tests
├── README.md                         # Dokumentasi project (file ini)
├── README_Project_Mandiri_MVP.md     # Spesifikasi MVP detail
└── system_workflow_overview.md       # Overview alur & teknologi sistem
```

---

## 11. Environment Variable

Buat file `.env.local` berdasarkan `.env.example`:

```env
# ============================================================
# Database (Supabase PostgreSQL via Prisma)
# ============================================================
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
TEST_DATABASE_URL="postgresql://postgres.TEST_PROJECT_REF:TEST_PASSWORD@aws-0-TEST_REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
TEST_DIRECT_URL="postgresql://postgres:TEST_PASSWORD@db.TEST_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"

# ============================================================
# Auth — secret untuk sign JWT session admin
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# ============================================================
AUTH_SECRET="replace-with-random-32-byte-hex-string"

# ============================================================
# Pinata IPFS (server-side only — opsional, bonus layer)
# Jika PINATA_JWT diisi, dokumen akan auto-upload ke IPFS saat didaftarkan
# ============================================================
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# ============================================================
# Blockchain (Bonus — opsional, masih di _legacy)
# ============================================================
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
CONTRACT_ADDRESS=0xYourContractAddress
SERVER_WALLET_PRIVATE_KEY=0xyourprivatekey

# ============================================================
# Public config (boleh diakses frontend)
# ============================================================
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.etherscan.io
```

> **Catatan:** `DATABASE_URL`, `DIRECT_URL`, dan `AUTH_SECRET` wajib untuk runtime/migrasi. `TEST_DATABASE_URL` + `TEST_DIRECT_URL` hanya wajib saat menjalankan integration test. Pinata dan Blockchain bersifat opsional.

---

## 12. Cara Menjalankan

### 12.1 Prasyarat

- Node.js versi 18 atau lebih baru untuk aplikasi utama; Node.js 22 LTS direkomendasikan jika ingin memakai TestSprite MCP
- npm (termasuk dalam instalasi Node.js)

### 12.2 Langkah-langkah

```bash
# 1. Install dependencies
npm install

# 2. Salin konfigurasi environment
cp .env.example .env.local
# Edit .env.local — minimal isi DATABASE_URL, DIRECT_URL, AUTH_SECRET

# 3. Generate Prisma client + push schema ke Supabase
npm run db:generate
npm run db:push

# 4. Migrasi data SQLite lama ke Supabase, atau seed data awal
npm run db:migrate:sqlite-to-supabase
# npm run db:seed

# 5. Jalankan development server
npm run dev
```

Buka aplikasi di browser:

```
http://localhost:3000
```

### 12.3 Akun Admin Seed

Sebelum menjalankan `npm run db:seed`, isi kredensial admin seed di `.env.local`:

```env
ADMIN_SEED_EMAIL="admin@uny.ac.id"
ADMIN_SEED_PASSWORD="ganti-dengan-password-kuat-minimal-12-karakter"
ADMIN_SEED_NAME="Administrator"
```

> **Penting:** jangan gunakan password contoh untuk lingkungan production.

### 12.4 Scripts NPM

| Script | Fungsi |
| :--- | :--- |
| `npm run dev` | Jalankan dev server (`next dev`) |
| `npm run build` | Production build |
| `npm run start` | Jalankan production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Sync schema ke Supabase PostgreSQL |
| `npm run db:migrate:sqlite-to-supabase` | Migrasi data `prisma/dev.db` ke Supabase |
| `npm run db:migrate:document-types` | Migrasi kategori lama ke `Sertifikat Akademik` / `Sertifikat Lainnya` |
| `npm run db:seed` | Seed data awal |
| `npm run db:reset` | Reset DB + seed ulang |
| `npm run db:studio` | Buka Prisma Studio (UI inspect data) |
| `npm run test:api` | Jalankan integration test API (Vitest) |
| `npm run test:typecheck` | Type-check (`tsc --noEmit`) |
| `npm test` | Alias `test:api` untuk test utama MVP |
| `npm run compile:contract` | Compile Solidity (Hardhat) |
| `npm run test:contract` | Test smart contract legacy |

---

## 13. Pengujian

### 13.1 Type Check

```bash
npm run lint
```

Menjalankan `tsc --noEmit` untuk memastikan tidak ada TypeScript error. Folder `_legacy/` di-exclude dari pemeriksaan.

### 13.2 Smart Contract Test (Hardhat)

```bash
npm run test:contract
```

Menjalankan test Solidity di folder `test/` (bukan `tests/`). Berdasarkan `CertificateRegistry.sol`.

### 13.3 Integration Test API (Vitest)

Framework Vitest sudah terkonfigurasi (`vitest.config.ts`, `.env.test`, `tests/global-setup.ts`, `tests/setup.ts`, `tests/helpers.ts`) dan test utama berada di folder `tests/`.

```bash
npm run test:api
```

Coverage utama:
- `/api/verify` — verifikasi VALID / NOT_REGISTERED / INVALID
- `/api/documents` — POST dokumen, validasi, duplicate detection (P2002)
- `/api/auth/login` — login sukses & gagal
- `/api/auth/change-password` — ubah password + CSRF
- `/api/auth/logout` — hapus session + audit log
- `/api/audit-logs` — pagination + filter action

Test API yang melakukan reset database wajib memakai Supabase project khusus test melalui `TEST_DATABASE_URL` dan `TEST_DIRECT_URL`, bukan project production.

### 13.4 TestSprite MCP Testing

TestSprite MCP dipakai untuk membuat dan menjalankan test berbasis AI dari IDE, terutama untuk alur frontend dan end-to-end lokal. Dokumentasi resmi: [Installation](https://docs.testsprite.com/mcp/getting-started/installation), [Create Tests for New Projects](https://docs.testsprite.com/mcp/core/create-tests-new-project), dan [Installation Issues](https://docs.testsprite.com/mcp/troubleshooting/installation-issues).

Prasyarat:
- Node.js 22 LTS atau lebih baru tersedia di PATH (`node --version`, `npm --version`, `npx --version`).
- API key TestSprite dibuat dari dashboard TestSprite dan disimpan hanya di konfigurasi MCP lokal.
- Jika `npx @testsprite/testsprite-mcp@latest` gagal dengan `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, tambahkan `NODE_OPTIONS=--use-system-ca` seperti contoh config di bawah.
- Jangan commit API key, password admin test, `.env.local`, report sensitif, atau screenshot yang memuat data rahasia.

Contoh konfigurasi VS Code di `.vscode/mcp.json`:

```json
{
  "servers": {
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your-api-key",
        "NODE_OPTIONS": "--use-system-ca"
      }
    }
  }
}
```

Siapkan aplikasi lokal sebelum menjalankan TestSprite:

```bash
npm run db:generate
npm run db:push
# Gunakan db:seed hanya pada database non-production/test project.
npm run dev
```

Konfigurasi run TestSprite:

```text
Project path: D:\Semester_6\Proyek Mandiri\PROJECT
Type: frontend
Scope: codebase
Local port: 3000
Frontend URL: http://localhost:3000
Need login: true
PRD: PRD.FINAL.md
```

Prompt awal di IDE:

```text
Can you test this project with TestSprite?
```

Target skenario yang perlu dicakup:
- Public verify upload: VALID, NOT_REGISTERED, INVALID/REVOKED.
- Admin login sukses dan gagal.
- Auth guard untuk route `/admin/*`.
- Dashboard admin, create document, revoke document.
- File preview/download, verification history, audit logs.
- Error state untuk file non-PDF atau PDF tidak valid.

Artifact sementara TestSprite yang tidak boleh dikomit sudah diabaikan lewat `.gitignore`; test case final di `testsprite_tests/` boleh direview dulu sebelum dikomit.

---

## 14. Folder `_legacy/`

Berisi kode dari iterasi awal proyek (era "CertChain Verify" yang fokus ke smart-contract Ethereum + IPFS) yang **tidak lagi dipakai** setelah refactor ke MVP DocuVerify UNY (database-first dengan Prisma + Supabase PostgreSQL).

Folder ini sengaja **tidak dihapus** agar:
1. Riwayat pengembangan tetap bisa ditelusuri untuk laporan skripsi.
2. Logika blockchain/IPFS Ethereum bisa dirujuk kembali kalau pengembangan lanjutan ingin re-aktivasi.
3. Memudahkan diff dengan implementasi MVP saat menulis bab "Perubahan Desain".

Lihat [`_legacy/README.md`](./_legacy/README.md) untuk mapping lama → baru.

---

## 15. Catatan Akademik

Pada tahap MVP, **SHA-256** digunakan sebagai simulasi mekanisme *content addressing* seperti yang digunakan oleh IPFS CID. Hal ini dilakukan agar fokus penelitian berada pada proses verifikasi keaslian dokumen melalui perbandingan identitas digital, tanpa kerumitan infrastruktur IPFS secara langsung.

Prinsipnya:
- Setiap file memiliki hash unik.
- Perubahan sekecil apapun pada file menghasilkan hash yang **berbeda total** (*avalanche effect*).
- Hash bersifat satu arah — tidak mungkin merekonstruksi file dari hash-nya.

Pada pengembangan lanjutan, sistem dapat ditingkatkan menggunakan:
- **IPFS asli** via Pinata (sudah disiapkan — aktif jika `PINATA_JWT` diisi).
- **Blockchain** via smart contract Ethereum (kode di folder `_legacy/`, perlu re-aktivasi).

### 15.1 Kandidat Judul Skripsi

1. Rancang Bangun Sistem Verifikasi Keaslian Dokumen Akademik Berbasis IPFS dan Hash Kriptografis SHA-256.
2. Implementasi Hash Kriptografis untuk Verifikasi Keaslian Dokumen Akademik Digital.
3. Pengembangan Sistem Verifikasi Dokumen Akademik Universitas Berbasis Content Identifier IPFS.

---

## 16. Roadmap Pengembangan

| No | Fitur | Status |
| :---: | :--- | :--- |
| 1 | Integrasi IPFS asli via Pinata | ✅ Sudah aktif (opsional via env) |
| 2 | Pencabutan Dokumen | ✅ Sudah implementasi (soft delete) |
| 3 | Pencarian & Filter Dokumen | ✅ Sudah implementasi |
| 4 | Riwayat Verifikasi (publik + admin) | ✅ Sudah implementasi |
| 5 | QR Code Verifikasi | ✅ Sudah implementasi (`qrcode`, spec-compliant) |
| 6 | Wire UI admin ke API real (Server Components) | ✅ Sudah implementasi |
| 7 | Duplicate detection via Prisma P2002 | ✅ Sudah implementasi |
| 8 | Test framework (Vitest) | ✅ Sudah terkonfigurasi + test API utama |
| 9 | Re-aktivasi Blockchain | ⏸ Kode di `_legacy/`, perlu refactor |
| 10 | Export Bukti Verifikasi PDF | ❌ Belum |
| 11 | Role Management (admin + verifier) | ❌ Belum |
| 12 | Audit Log aktivitas admin | ✅ Sudah implementasi |
| 13 | Rate limiting `/api/verify` | ✅ Sudah implementasi |
| 14 | Laporan Statistik dengan chart | ❌ Belum |
| 15 | E2E Testing (Playwright) | ❌ Belum |

---

## Kesimpulan

DocuVerify UNY merupakan prototype sistem verifikasi dokumen akademik yang dibangun sebagai Project Mandiri / Skripsi. Fokus utama sistem adalah memastikan bahwa dokumen yang diverifikasi memiliki identitas digital yang sama dengan dokumen asli yang telah didaftarkan oleh pihak internal UNY.

Dengan pendekatan hash kriptografis **SHA-256** sebagai simulasi **IPFS CID**, didukung web application modern (**Next.js 15 + React 19 + TypeScript + Tailwind CSS + Prisma + Supabase PostgreSQL**), sistem ini menyediakan solusi verifikasi yang **transparan**, **mudah digunakan**, dan **tahan terhadap manipulasi data**.

---

**© 2025 DocuVerify UNY — Universitas Negeri Yogyakarta**
