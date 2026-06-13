# Product Requirements Document (PRD) Final

Nama produk: DocuVerify UNY  
Versi dokumen: Final untuk acuan pengujian TestSprite  
Tanggal pembaruan: 11 Juni 2026  
Platform: Web application berbasis Next.js, React, TypeScript, Prisma, SQLite

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan fungsional, teknis, dan acceptance criteria untuk pengujian end-to-end DocuVerify UNY menggunakan TestSprite. TestSprite harus memakai dokumen ini sebagai sumber utama untuk memahami fitur yang perlu diuji, alur pengguna, data uji, validasi, batasan sistem, dan hasil yang diharapkan.

Fokus pengujian adalah aplikasi web DocuVerify UNY yang berjalan lokal pada `http://localhost:3000`.

## 2. Ringkasan Produk

DocuVerify UNY adalah sistem verifikasi keaslian dokumen akademik Universitas Negeri Yogyakarta. Sistem memungkinkan admin institusi mendaftarkan dokumen PDF resmi, menyimpan metadata dan hash SHA-256 dokumen, lalu memungkinkan pengguna publik memverifikasi apakah file PDF yang mereka miliki identik dengan dokumen yang pernah didaftarkan.

Sistem tidak membaca isi dokumen dan tidak menentukan keabsahan hukum. Penilaian validitas dilakukan berdasarkan kecocokan hash SHA-256 file PDF.

Hasil verifikasi memiliki tiga status:

| Status | Arti | Kondisi |
| --- | --- | --- |
| `VALID` | Dokumen terverifikasi | Hash file cocok dengan dokumen terdaftar dan status dokumen `ACTIVE` |
| `NOT_REGISTERED` | Dokumen belum terdaftar | Hash file tidak ditemukan di database |
| `INVALID` | Dokumen tidak berlaku | Hash file cocok dengan dokumen terdaftar, tetapi status dokumen `REVOKED` |

## 3. Sasaran Produk

1. Menyediakan halaman publik untuk memverifikasi dokumen akademik PDF tanpa login.
2. Menyediakan dashboard admin untuk pendaftaran, pengelolaan, pencabutan, dan audit dokumen.
3. Menggunakan SHA-256 sebagai sidik jari digital utama yang dihitung di server.
4. Menyimpan file dokumen terdaftar di folder server `uploads/`, bukan di folder publik.
5. Mencatat setiap percobaan verifikasi ke `VerificationLog`.
6. Mencatat aksi penting admin ke `AdminAuditLog`.
7. Menyediakan layer IPFS/Pinata opsional sebagai informasi tambahan, tanpa menjadikan IPFS sebagai syarat sukses pendaftaran dokumen.

## 4. Aktor dan Hak Akses

| Aktor | Deskripsi | Hak Akses |
| --- | --- | --- |
| Pengguna Publik | Mahasiswa, alumni, instansi, atau pihak luar yang ingin memeriksa keaslian dokumen | Mengakses landing page, verifikasi PDF, dan riwayat verifikasi publik |
| Admin Institusi | Petugas internal UNY yang berwenang mendaftarkan dan mengelola dokumen | Login, dashboard, daftar dokumen, detail dokumen, upload dokumen, revoke dokumen, riwayat verifikasi, audit log, ubah password, logout |
| Pengelola Sistem | Tim yang menyiapkan environment, database, seed data, dan deployment | Mengatur `.env.local`, database, file storage, Pinata opsional, dan kredensial admin |

## 5. Ruang Lingkup

### 5.1 In Scope

1. Landing page publik.
2. Verifikasi dokumen PDF publik.
3. Riwayat verifikasi publik 50 data terbaru.
4. Login admin berbasis email dan password.
5. Proteksi route `/admin/*` menggunakan cookie JWT.
6. Dashboard admin dengan statistik dokumen dan verifikasi.
7. Pendaftaran dokumen akademik PDF.
8. Daftar dokumen dengan pencarian, filter, dan pagination.
9. Detail dokumen dengan metadata, hash SHA-256, CID IPFS opsional, QR Code, preview PDF, download PDF, dan 10 verifikasi terbaru.
10. Pencabutan dokumen melalui soft delete status `REVOKED`.
11. Riwayat verifikasi admin dengan data lebih lengkap.
12. Audit log admin.
13. Ubah password admin.
14. Logout admin melalui endpoint POST ber-CSRF.
15. Validasi upload PDF dari sisi client dan server.
16. Rate limit login dan verifikasi publik.
17. Test API dengan Vitest dan test end-to-end dengan TestSprite.

### 5.2 Out of Scope

1. OCR atau pembacaan isi PDF.
2. Penentuan keabsahan hukum dokumen.
3. Integrasi langsung dengan SIAKAD atau database akademik resmi UNY.
4. Role management multi-level.
5. Export bukti verifikasi PDF.
6. Blockchain aktif pada MVP utama.
7. Pembayaran atau monetisasi.
8. Upload file pengguna publik ke IPFS saat verifikasi.
9. Akses publik ke file PDF asli yang tersimpan di server.

## 6. Teknologi dan Runtime

| Area | Teknologi |
| --- | --- |
| Frontend | Next.js App Router, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Node.js runtime |
| Database | Prisma ORM, SQLite lokal |
| Auth | JWT cookie, `jose`, bcrypt password hashing |
| Validasi | Zod, validasi file PDF, magic bytes `%PDF-` |
| File Storage | Folder lokal `uploads/` |
| IPFS Opsional | Pinata SDK, aktif jika `PINATA_JWT` tersedia |
| QR Code | Library `qrcode` |
| Test | Vitest untuk API, TestSprite untuk E2E UI |

## 7. Route dan Halaman

### 7.1 Halaman Publik

| Route | Fungsi | Acceptance Criteria |
| --- | --- | --- |
| `/` | Landing page DocuVerify UNY | Menampilkan identitas produk, navigasi ke verifikasi, riwayat, dan login admin |
| `/verify` | Form verifikasi publik | Pengguna dapat memilih PDF, melihat nama/ukuran file, menghapus pilihan file, submit, dan melihat hasil `VALID`, `NOT_REGISTERED`, atau `INVALID` |
| `/history` | Riwayat verifikasi publik | Menampilkan maksimal 50 verifikasi terbaru tanpa IP address dan tanpa metadata sensitif |

### 7.2 Halaman Admin

Semua route admin kecuali `/admin/login` wajib membutuhkan session valid.

| Route | Fungsi | Acceptance Criteria |
| --- | --- | --- |
| `/admin/login` | Login admin | Kredensial valid mengarah ke dashboard atau redirect aman; kredensial salah menampilkan error |
| `/admin/dashboard` | Ringkasan statistik | Menampilkan total dokumen, total verifikasi, valid, tidak terdaftar, dan invalid |
| `/admin/documents` | Daftar dokumen | Menampilkan tabel dokumen, search, filter jenis, filter fakultas, filter status, pagination, dan link detail |
| `/admin/documents/create` | Pendaftaran dokumen | Admin dapat mengisi metadata dan upload PDF <= 10 MB; sukses menampilkan hash dan link detail |
| `/admin/documents/[id]` | Detail dokumen | Menampilkan metadata, status, hash, CID opsional, QR Code, preview/download PDF, revoke action, dan verifikasi terbaru |
| `/admin/verifications` | Riwayat verifikasi admin | Menampilkan log verifikasi lengkap dengan filter status dan pagination |
| `/admin/audit-logs` | Audit log admin | Menampilkan aksi admin seperti create document, revoke, password changed, logout |
| `/admin/account` | Ubah password | Admin dapat mengganti password dengan password lama valid dan password baru minimal 12 karakter |

## 8. API Contract

### 8.1 Auth

| Endpoint | Method | Akses | Fungsi |
| --- | --- | --- | --- |
| `/api/auth/login` | POST | Publik | Login admin dengan JSON `{ email, password }` |
| `/api/auth/me` | GET | Admin | Mengambil profil admin aktif |
| `/api/auth/csrf` | GET | Admin | Menghasilkan token CSRF untuk request mutasi admin |
| `/api/auth/change-password` | POST | Admin + CSRF | Mengubah password admin aktif |
| `/api/auth/logout` | POST | Admin + CSRF | Menghapus session dan mencatat audit logout |

### 8.2 Dokumen

| Endpoint | Method | Akses | Fungsi |
| --- | --- | --- | --- |
| `/api/documents` | GET | Admin | List dokumen dengan `search`, `documentType`, `faculty`, `status`, `page`, `limit` |
| `/api/documents` | POST | Admin + CSRF | Daftarkan dokumen baru melalui `multipart/form-data` |
| `/api/documents/[id]` | GET | Admin | Detail dokumen dan 10 verifikasi terbaru |
| `/api/documents/[id]` | DELETE | Admin + CSRF | Revoke dokumen, mengubah status ke `REVOKED` |
| `/api/documents/[id]/file` | GET | Admin | Preview PDF inline |
| `/api/documents/[id]/file?download=1` | GET | Admin | Download PDF |

### 8.3 Verifikasi dan Audit

| Endpoint | Method | Akses | Fungsi |
| --- | --- | --- | --- |
| `/api/verify` | POST | Publik | Verifikasi PDF melalui `multipart/form-data` field `file` |
| `/api/verifications?scope=public` | GET | Publik | Riwayat publik tanpa IP address |
| `/api/verifications?scope=admin` | GET | Admin | Riwayat admin lengkap dengan pagination/filter |
| `/api/audit-logs` | GET | Admin | Audit log admin dengan pagination/filter action |
| `/api/dashboard/stats` | GET | Admin | Statistik dashboard |

## 9. Model Data

### 9.1 `Admin`

| Field | Keterangan |
| --- | --- |
| `id` | Primary key |
| `name` | Nama admin |
| `email` | Email unik |
| `passwordHash` | Hash password bcrypt |
| `createdAt`, `updatedAt` | Timestamp |

### 9.2 `Document`

| Field | Keterangan |
| --- | --- |
| `id` | Primary key |
| `title` | Judul dokumen |
| `documentType` | Salah satu jenis dokumen resmi |
| `ownerName` | Nama pemilik dokumen |
| `ownerIdentity` | NIM/identitas pemilik |
| `faculty` | Fakultas |
| `studyProgram` | Program studi |
| `documentYear` | Tahun dokumen, 2000-2099 |
| `institution` | Default `Universitas Negeri Yogyakarta` |
| `fileName` | Nama file asli |
| `filePath` | Lokasi relatif file di `uploads/` |
| `hashSHA256` | Hash unik file PDF |
| `ipfsCid` | CID opsional dari Pinata |
| `ipfsFileId` | ID file opsional dari Pinata |
| `status` | `ACTIVE` atau `REVOKED` |
| `createdAt`, `updatedAt` | Timestamp |

### 9.3 `VerificationLog`

| Field | Keterangan |
| --- | --- |
| `id` | Primary key |
| `uploadedHash` | Hash file yang diverifikasi |
| `status` | `VALID`, `NOT_REGISTERED`, atau `INVALID` |
| `documentId` | Relasi ke dokumen jika hash ditemukan |
| `ipAddress` | IP pemohon, hanya untuk audit admin |
| `createdAt` | Timestamp |

### 9.4 `AdminAuditLog`

| Field | Keterangan |
| --- | --- |
| `id` | Primary key |
| `adminId` | Admin pelaku aksi |
| `action` | `DOCUMENT_CREATED`, `DOCUMENT_REVOKED`, `PASSWORD_CHANGED`, `LOGOUT` |
| `targetType` | Jenis target, misalnya `Document` atau `Admin` |
| `targetId` | ID target |
| `metadata` | Metadata JSON string opsional |
| `ipAddress` | IP admin |
| `createdAt` | Timestamp |

## 10. Validasi Data

### 10.1 Validasi File PDF

| Aturan | Acceptance Criteria |
| --- | --- |
| File wajib ada | Submit tanpa file harus menampilkan error |
| Format PDF | File harus memiliki MIME `application/pdf` atau ekstensi `.pdf` pada client, dan magic bytes `%PDF-` pada server |
| Ukuran file | Maksimal 10 MB |
| File verifikasi publik | Tidak disimpan permanen; hanya dipakai untuk menghitung hash |
| File pendaftaran admin | Disimpan di folder `uploads/` jika registrasi database berhasil |
| Duplicate hash | Upload dokumen yang sama kedua kali harus ditolak dengan status konflik/error informatif |

### 10.2 Validasi Metadata Dokumen

| Field | Aturan |
| --- | --- |
| `title` | Wajib, maksimal 300 karakter |
| `documentType` | Wajib, harus salah satu daftar jenis dokumen |
| `ownerName` | Wajib, maksimal 200 karakter |
| `ownerIdentity` | Wajib, maksimal 50 karakter |
| `faculty` | Wajib, harus salah satu daftar fakultas |
| `studyProgram` | Wajib, maksimal 200 karakter |
| `documentYear` | Wajib, integer 2000-2099 |

Jenis dokumen yang diterima:

1. Sertifikat Akademik
2. Sertifikat Lainnya

Fakultas yang diterima:

1. Fakultas Ilmu Pendidikan dan Psikologi
2. Fakultas Ilmu Sosial, Hukum dan Ilmu Politik
3. Fakultas Matematika dan Ilmu Pengetahuan Alam
4. Fakultas Ekonomi dan Bisnis
5. Fakultas Teknik
6. Fakultas Ilmu Keolahragaan dan Kesehatan
7. Fakultas Bahasa, Seni dan Budaya
8. Fakultas Vokasi
9. Pascasarjana

### 10.3 Validasi Auth

| Area | Aturan |
| --- | --- |
| Login | Email harus valid, password wajib diisi |
| Rate limit login | Maksimal 5 percobaan per email/IP dalam 10 menit |
| Session | Cookie JWT berlaku 7 hari |
| Admin route | `/admin/*` redirect ke `/admin/login?redirect=...` jika belum login |
| Redirect login | Redirect hanya boleh ke path internal `/admin/...` yang aman |
| Mutasi admin | Request POST/DELETE admin wajib memakai CSRF token |
| Password baru | Minimal 12 karakter dan konfirmasi harus sama |

## 11. Alur Utama

### 11.1 Pendaftaran Dokumen oleh Admin

1. Admin login melalui `/admin/login`.
2. Admin membuka `/admin/documents/create`.
3. Admin mengisi metadata dokumen.
4. Admin memilih file PDF <= 10 MB.
5. Frontend menampilkan nama dan ukuran file.
6. Admin submit form.
7. Backend memvalidasi session dan CSRF.
8. Backend memvalidasi metadata dan file PDF.
9. Backend menghitung hash SHA-256 dari buffer PDF.
10. Backend menyimpan file ke `uploads/`.
11. Backend mencoba upload ke Pinata jika konfigurasi tersedia. Jika Pinata gagal atau tidak dikonfigurasi, pendaftaran tetap dapat berhasil tanpa CID.
12. Backend menyimpan record `Document`.
13. Backend mencatat `AdminAuditLog` action `DOCUMENT_CREATED`.
14. UI menampilkan pesan sukses, hash SHA-256, CID opsional, dan link detail.

### 11.2 Verifikasi Dokumen oleh Publik

1. Pengguna membuka `/verify`.
2. Pengguna memilih file PDF <= 10 MB.
3. UI menampilkan nama dan ukuran file.
4. Pengguna submit.
5. Backend menerapkan rate limit.
6. Backend memvalidasi file PDF dan magic bytes.
7. Backend menghitung hash SHA-256.
8. Backend mencari `Document.hashSHA256`.
9. Jika tidak ditemukan, hasil `NOT_REGISTERED`.
10. Jika ditemukan dengan status `ACTIVE`, hasil `VALID`.
11. Jika ditemukan dengan status `REVOKED`, hasil `INVALID`.
12. Backend mencatat `VerificationLog`.
13. UI menampilkan status, pesan, uploaded hash, reference hash jika ada, dan metadata masked jika `VALID`.

### 11.3 Pencabutan Dokumen

1. Admin membuka detail dokumen.
2. Admin menekan aksi cabut dokumen.
3. UI menampilkan konfirmasi.
4. Admin mengonfirmasi.
5. Backend memvalidasi session dan CSRF.
6. Backend mengubah status dokumen dari `ACTIVE` ke `REVOKED`.
7. Backend mencatat audit action `DOCUMENT_REVOKED`.
8. Detail dokumen berubah menjadi status dicabut.
9. Jika file yang sama diverifikasi publik, hasil harus `INVALID`.

## 12. Functional Requirements

| ID | Requirement | Acceptance Criteria |
| --- | --- | --- |
| FR-01 | Landing page publik | `/` dapat diakses tanpa login dan menyediakan navigasi ke `/verify`, `/history`, dan `/admin/login` |
| FR-02 | Verifikasi publik berhasil | PDF yang sudah didaftarkan dan masih `ACTIVE` menghasilkan `VALID` dan metadata masked |
| FR-03 | Verifikasi file belum terdaftar | PDF yang belum pernah didaftarkan menghasilkan `NOT_REGISTERED` |
| FR-04 | Verifikasi dokumen revoked | PDF yang cocok dengan dokumen `REVOKED` menghasilkan `INVALID` |
| FR-05 | Riwayat publik | `/history` menampilkan 50 log terbaru tanpa IP address dan tanpa data sensitif |
| FR-06 | Login admin | Kredensial valid membuat session dan redirect ke dashboard; kredensial salah menampilkan error |
| FR-07 | Auth guard admin | Akses `/admin/dashboard` tanpa session harus redirect ke `/admin/login?redirect=/admin/dashboard` |
| FR-08 | Dashboard admin | Menampilkan statistik total dokumen dan verifikasi |
| FR-09 | Pendaftaran dokumen | Admin dapat mendaftarkan PDF valid dengan metadata lengkap dan mendapat hash SHA-256 |
| FR-10 | Duplicate document | Mendaftarkan file PDF yang sama dua kali harus ditolak karena `hashSHA256` unik |
| FR-11 | Daftar dokumen | Admin dapat mencari dan memfilter dokumen berdasarkan judul/nama/NIM/hash, jenis, fakultas, dan status |
| FR-12 | Detail dokumen | Admin dapat melihat metadata lengkap, hash, CID opsional, QR Code, preview/download, dan verifikasi terbaru |
| FR-13 | Revoke dokumen | Admin dapat mengubah status dokumen menjadi `REVOKED`; revoke kedua kali ditolak |
| FR-14 | Riwayat verifikasi admin | Admin dapat melihat log verifikasi lengkap dengan status dan pagination |
| FR-15 | Audit log admin | Aksi create, revoke, password changed, dan logout tercatat |
| FR-16 | Ubah password | Password lama valid dan password baru minimal 12 karakter berhasil mengubah password |
| FR-17 | Logout | Logout menghapus session, mencatat audit log, dan route admin kembali terlindungi |
| FR-18 | Validasi upload | File non-PDF, PDF palsu, file kosong, dan file >10 MB ditolak dengan pesan jelas |

## 13. Non-Functional Requirements

| ID | Requirement | Acceptance Criteria |
| --- | --- | --- |
| NFR-01 | Keamanan password | Password admin disimpan sebagai hash bcrypt, bukan plain text |
| NFR-02 | Session security | Session admin memakai JWT cookie `docuverify_session` |
| NFR-03 | CSRF protection | Mutasi admin tanpa CSRF harus gagal |
| NFR-04 | Privacy | Verifikasi publik tidak menyimpan file pengguna dan tidak menampilkan IP address di halaman publik |
| NFR-05 | File access control | File asli hanya dapat diakses admin melalui API berautentikasi |
| NFR-06 | Konsistensi data | Jika insert database gagal karena duplicate hash, file yang baru disimpan harus dihapus kembali |
| NFR-07 | Responsif | Halaman utama, verifikasi, login, daftar dokumen, dan detail dokumen harus usable di desktop dan mobile |
| NFR-08 | Auditability | Aksi admin penting dan percobaan verifikasi harus tercatat |
| NFR-09 | Performance | Verifikasi PDF <= 10 MB selesai dalam waktu wajar untuk pengujian lokal, target kurang dari 2 detik pada mesin dev normal |
| NFR-10 | Graceful IPFS fallback | Pinata tidak dikonfigurasi atau upload gagal tidak boleh menggagalkan pendaftaran dokumen lokal |

## 14. Instruksi Khusus untuk TestSprite

1. Gunakan base URL `http://localhost:3000`.
2. Jalankan pengujian di database lokal/test, bukan data produksi.
3. Untuk skenario `VALID`, jangan mengandalkan dokumen seed karena file fisik seed mungkin tidak tersedia. Buat dokumen baru melalui UI admin, lalu verifikasi file PDF yang sama melalui `/verify`.
4. Untuk skenario `INVALID`, buat dokumen baru, revoke dokumen tersebut, lalu verifikasi file PDF yang sama.
5. Untuk skenario `NOT_REGISTERED`, gunakan PDF lain yang belum pernah didaftarkan.
6. Untuk duplicate test, daftarkan file PDF yang sama dua kali melalui form admin.
7. Jangan menguji folder `_legacy/` sebagai flow utama.
8. Jangan mengharapkan blockchain aktif.
9. Jangan menganggap IPFS CID wajib muncul. CID hanya muncul jika Pinata berhasil dikonfigurasi dan upload berhasil.
10. Hindari menyimpan API key, password, screenshot sensitif, atau data rahasia ke artifact yang akan dikomit.

## 15. Data Uji yang Direkomendasikan

### 15.1 Admin Seed

Kredensial admin berasal dari `.env.local`:

```env
ADMIN_SEED_EMAIL="admin@uny.ac.id"
ADMIN_SEED_PASSWORD="password-minimal-12-karakter"
ADMIN_SEED_NAME="Administrator"
```

TestSprite harus memakai nilai aktual yang disiapkan penguji di environment lokal. Jangan menebak password jika `.env.local` berbeda.

### 15.2 Metadata Dokumen Uji

Gunakan data berikut untuk dokumen yang dibuat saat test:

| Field | Nilai |
| --- | --- |
| Judul | Dokumen TestSprite Verifikasi SHA-256 |
| Jenis Dokumen | Sertifikat Akademik |
| Nama Pemilik | Budi Santoso |
| NIM | 20108241099 |
| Fakultas | Fakultas Teknik |
| Program Studi | Pendidikan Teknik Informatika |
| Tahun | 2026 |
| Institusi | Universitas Negeri Yogyakarta |

### 15.3 File PDF Uji

TestSprite dapat membuat file PDF kecil yang valid secara teknis. File harus diawali magic bytes `%PDF-` agar validasi server lolos.

Contoh minimal konten PDF untuk file uji:

```text
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
```

Buat minimal tiga file berbeda:

1. `valid-source.pdf` untuk didaftarkan lalu diverifikasi.
2. `not-registered.pdf` untuk hasil `NOT_REGISTERED`.
3. `revoked-source.pdf` untuk didaftarkan, dicabut, lalu diverifikasi sebagai `INVALID`.

## 16. Test Suite Prioritas untuk TestSprite

### 16.1 P0 - Critical Flows

| ID | Skenario | Langkah Ringkas | Expected Result |
| --- | --- | --- | --- |
| TS-P0-01 | Public verify empty submit | Buka `/verify`, submit tanpa file | Tombol disabled atau error meminta file PDF |
| TS-P0-02 | Public verify non-PDF | Upload file `.txt` atau PDF palsu tanpa magic bytes | Sistem menolak dengan pesan file harus PDF valid |
| TS-P0-03 | Admin auth guard | Buka `/admin/dashboard` tanpa login | Redirect ke `/admin/login?redirect=/admin/dashboard` |
| TS-P0-04 | Admin login gagal | Login dengan email/password salah | Tetap di login dan menampilkan pesan error |
| TS-P0-05 | Admin login sukses | Login dengan kredensial seed valid | Redirect ke `/admin/dashboard` |
| TS-P0-06 | Create document success | Dari admin, buka create, isi metadata, upload PDF valid | Dokumen tersimpan, hash muncul, link detail tersedia |
| TS-P0-07 | Verify registered active document | Verifikasi file yang baru didaftarkan di `/verify` | Status `VALID`, hash cocok, metadata masked tampil |
| TS-P0-08 | Verify unregistered document | Verifikasi PDF berbeda yang belum didaftarkan | Status `NOT_REGISTERED`, log bertambah |
| TS-P0-09 | Revoke and verify | Revoke dokumen aktif, lalu verifikasi file yang sama | Status dokumen `REVOKED`, hasil verifikasi `INVALID` |
| TS-P0-10 | Logout protection | Logout dari admin, lalu buka `/admin/dashboard` | Session hilang dan redirect ke login |

### 16.2 P1 - Admin Management

| ID | Skenario | Langkah Ringkas | Expected Result |
| --- | --- | --- | --- |
| TS-P1-01 | Dashboard stats | Login dan buka dashboard | Statistik tampil dan berubah setelah verifikasi baru |
| TS-P1-02 | Document list search | Cari dokumen berdasarkan judul test | Dokumen yang sesuai tampil |
| TS-P1-03 | Document filter by type | Filter jenis `Sertifikat Akademik` | Daftar hanya menampilkan dokumen sesuai filter |
| TS-P1-04 | Document filter by faculty | Filter `Fakultas Teknik` | Daftar hanya menampilkan dokumen fakultas tersebut |
| TS-P1-05 | Document filter by status | Filter `ACTIVE` lalu `REVOKED` | Daftar mengikuti status yang dipilih |
| TS-P1-06 | Document detail | Buka detail dokumen test | Metadata, hash, status, QR Code, dan aksi cepat tampil |
| TS-P1-07 | Duplicate document upload | Upload file PDF yang sama dua kali | Upload kedua ditolak dengan pesan duplicate hash |
| TS-P1-08 | Preview/download file | Dari detail dokumen yang dibuat saat test, klik preview/download | Endpoint file merespons PDF untuk admin login |
| TS-P1-09 | Admin verification history | Buka `/admin/verifications` setelah beberapa verify | Log `VALID`, `NOT_REGISTERED`, dan `INVALID` muncul |
| TS-P1-10 | Audit logs | Buka `/admin/audit-logs` | Aksi create, revoke, logout/password jika dilakukan tercatat |

### 16.3 P2 - Security, Validation, and Edge Cases

| ID | Skenario | Langkah Ringkas | Expected Result |
| --- | --- | --- | --- |
| TS-P2-01 | Oversized PDF validation | Upload file >10 MB | Ditolak dengan pesan ukuran maksimal 10 MB |
| TS-P2-02 | Invalid year low | Isi tahun 1999 saat create | Ditolak karena tahun minimal 2000 |
| TS-P2-03 | Invalid year high | Isi tahun 2100 saat create | Ditolak karena tahun maksimal 2099 |
| TS-P2-04 | Missing metadata | Kosongkan field wajib saat create | Form/API menolak field wajib |
| TS-P2-05 | Admin file endpoint unauthenticated | Buka `/api/documents/[id]/file` tanpa session | Ditolak/redirect karena admin only |
| TS-P2-06 | Change password mismatch | Isi password baru dan konfirmasi berbeda | Ditolak dengan pesan konfirmasi tidak cocok |
| TS-P2-07 | Change password short | Isi password baru kurang dari 12 karakter | Ditolak |
| TS-P2-08 | Change password wrong old password | Isi password lama salah | Ditolak |
| TS-P2-09 | Public history privacy | Buka `/history` | Tidak ada IP address atau metadata owner lengkap sensitif |
| TS-P2-10 | Login redirect safety | Buka `/admin/login?redirect=https://example.com` lalu login | Redirect tetap ke path admin yang aman, bukan domain eksternal |

## 17. Setup Lokal untuk Testing

### 17.1 Environment Minimum

File `.env.local` wajib memiliki minimal:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ganti-dengan-random-secret-32-byte"
ADMIN_SEED_EMAIL="admin@uny.ac.id"
ADMIN_SEED_PASSWORD="password-admin-minimal-12-karakter"
ADMIN_SEED_NAME="Administrator"
```

Pinata opsional:

```env
PINATA_JWT="..."
PINATA_GATEWAY="https://gateway.pinata.cloud/ipfs"
```

Jika Pinata tidak diisi, test tetap valid selama dokumen lokal berhasil didaftarkan dan diverifikasi.

### 17.2 Perintah Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Aplikasi berjalan di:

```text
http://localhost:3000
```

### 17.3 Perintah Verifikasi Teknis

```bash
npm run lint
npm run test:api
npm run build
```

Catatan: `npm run lint` pada project ini menjalankan `tsc --noEmit`.

## 18. Definition of Done untuk TestSprite

Pengujian dianggap memenuhi PRD jika:

1. Semua skenario P0 lulus.
2. Skenario P1 inti untuk daftar dokumen, detail dokumen, duplicate upload, riwayat, dan audit log lulus.
3. Negative case utama untuk file non-PDF, file >10 MB, metadata kosong, login salah, auth guard, dan redirect safety lulus.
4. TestSprite menghasilkan laporan yang memuat route yang diuji, langkah uji, hasil aktual, screenshot jika tersedia, dan daftar bug jika ada.
5. Tidak ada expectation yang bergantung pada blockchain aktif atau CID IPFS wajib.
6. Tidak ada data rahasia yang ikut tersimpan dalam artifact pengujian.

## 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| File seed tidak ada secara fisik | Preview/download seed document bisa 404 | Untuk E2E file, buat dokumen baru saat test |
| Pinata tidak dikonfigurasi | CID tidak muncul | Perlakukan IPFS sebagai opsional |
| Test memakai database lama | Data duplicate atau statistik tidak stabil | Reset database lokal sebelum run besar |
| Password seed berbeda | Login TestSprite gagal | Ambil kredensial dari `.env.local` yang dipakai penguji |
| Rate limit aktif | Test login/verify berulang bisa dibatasi | Gunakan data valid dan jeda/reset server/database jika perlu |
| Artifact berisi data sensitif | Risiko kebocoran | Jangan commit `.env.local`, report rahasia, atau screenshot sensitif |

## 20. Catatan Implementasi Penting

1. SHA-256 dihitung di server dan menjadi sumber kebenaran utama.
2. Verifikasi publik tidak menyimpan file pengguna.
3. Metadata pemilik pada hasil `VALID` diproteksi dengan masking.
4. File dokumen admin disimpan di luar `public/`.
5. Revoke adalah soft delete; baris dokumen tetap ada untuk audit trail.
6. Pinata adalah bonus layer yang bersifat best-effort.
7. Folder `_legacy/` berisi eksperimen blockchain lama dan bukan jalur utama MVP.
8. TestSprite harus memprioritaskan flow web nyata melalui browser, lalu dapat memakai API untuk validasi tambahan jika diperlukan.
