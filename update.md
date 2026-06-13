# Update Progress Website

## 2026-06-05 - Progress MVP DocuVerify UNY

Ringkasan update: pengembangan terbaru menyelesaikan perubahan besar dari prototype frontend menjadi aplikasi web DocuVerify UNY yang lebih fungsional untuk pendaftaran, pengelolaan, dan verifikasi dokumen akademik berbasis hash SHA-256, database Prisma/SQLite, serta integrasi opsional IPFS melalui Pinata.

### Added

- Menambahkan area admin untuk login, dashboard statistik, daftar dokumen, pendaftaran dokumen baru, detail dokumen, dan riwayat verifikasi.
- Menambahkan sistem autentikasi admin dengan email dan password, termasuk endpoint login, logout, dan pengecekan sesi aktif.
- Menambahkan database Prisma/SQLite untuk menyimpan akun admin, metadata dokumen, hash SHA-256, CID IPFS opsional, status dokumen, dan log verifikasi.
- Menambahkan fitur pendaftaran dokumen PDF oleh admin dengan metadata lengkap seperti judul, jenis dokumen, nama pemilik, NIM, fakultas, program studi, dan tahun dokumen.
- Menambahkan proses perhitungan hash SHA-256 secara server-side untuk memastikan identitas digital dokumen dihitung secara konsisten dan terpercaya.
- Menambahkan halaman verifikasi publik yang memungkinkan pengguna mengunggah PDF dan mendapatkan status `VALID`, `NOT_REGISTERED`, atau `INVALID`.
- Menambahkan pencatatan riwayat setiap percobaan verifikasi, termasuk hash yang diuji, status hasil, dokumen terkait, waktu verifikasi, dan IP address untuk tampilan admin.
- Menambahkan fitur detail dokumen admin, termasuk metadata, hash, CID IPFS, riwayat verifikasi terbaru, pratinjau PDF, unduh dokumen asli, dan QR visual dokumen.
- Menambahkan mekanisme pencabutan dokumen melalui status `REVOKED`, sehingga dokumen yang sudah dicabut akan menghasilkan status verifikasi `INVALID`.
- Menambahkan seed data untuk admin default, contoh dokumen akademik, dan contoh riwayat verifikasi.
- Menambahkan konfigurasi Vitest serta test API untuk autentikasi, pendaftaran dokumen, dan verifikasi dokumen.

### Changed

- Mengubah arsitektur fitur dari endpoint lama berbasis `certificates` menjadi endpoint baru berbasis `documents`, `verify`, `verifications`, `dashboard`, dan `auth`.
- Mengubah alur utama aplikasi menjadi model MVP DocuVerify UNY: admin mendaftarkan dokumen, publik memverifikasi dokumen, dan admin memantau riwayat verifikasi.
- Mengubah integrasi Pinata/IPFS menjadi best-effort, sehingga kegagalan upload ke Pinata tidak menggagalkan pendaftaran dokumen utama di database.
- Memperbarui tampilan halaman publik, navigasi, dashboard admin, tabel data, form upload, dan komponen verifikasi agar lebih konsisten dengan identitas DocuVerify UNY.
- Memperbarui dokumentasi README agar menjelaskan tujuan sistem, arsitektur, fitur, environment variable, struktur folder, cara menjalankan, dan pengujian.
- Memindahkan pendekatan lama terkait blockchain/contract ke jalur legacy dan memfokuskan MVP saat ini pada verifikasi berbasis hash SHA-256 serta penyimpanan database.

### Fixed

- Memperbaiki risiko duplikasi dokumen dengan menggunakan hash SHA-256 sebagai field unik di database.
- Memperbaiki alur pendaftaran agar file yang sudah tersimpan akan dibersihkan kembali jika proses insert database gagal.
- Memperbaiki validasi upload agar hanya menerima file PDF dengan batas ukuran maksimal 10 MB.
- Memperbaiki hasil verifikasi agar membedakan dokumen aktif, dokumen tidak terdaftar, dan dokumen yang sudah dicabut.
- Memperbaiki penanganan error API melalui format error terpusat agar pesan validasi, autentikasi, not found, dan IPFS lebih mudah dipahami.

### Security

- Menambahkan proteksi seluruh route `/admin/*` menggunakan session JWT pada cookie `httpOnly`.
- Menambahkan hashing password admin menggunakan bcrypt.
- Menambahkan middleware untuk mencegah akses dashboard, dokumen, file asli, dan riwayat admin tanpa sesi valid.
- Menyimpan file upload di folder server-side, bukan di folder public, sehingga dokumen asli tidak dapat diakses langsung tanpa melewati API admin.
- Menambahkan sanitasi nama file dan validasi path untuk mengurangi risiko path traversal.
- Menjaga upload verifikasi publik agar tidak menyimpan file pengguna ke disk; file hanya dipakai untuk menghitung hash.
- Membatasi data riwayat verifikasi publik agar tidak mengekspos IP address, sementara data lengkap hanya tersedia untuk admin.
