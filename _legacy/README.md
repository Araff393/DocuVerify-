# `_legacy/` — Arsip Kode Lama (Pre-MVP)

Folder ini berisi kode dari iterasi awal proyek (era "CertChain Verify" yang fokus ke smart-contract Ethereum + IPFS) yang **tidak lagi dipakai** setelah refactor ke MVP DocuVerify UNY (database-first dengan Prisma + SQLite).

Folder ini sengaja **tidak dihapus** agar:
1. Riwayat pengembangan tetap bisa ditelusuri untuk laporan skripsi.
2. Logika blockchain/IPFS ETH bisa dirujuk kembali kalau pengembangan lanjutan ingin re-aktivasi.
3. Memudahkan diff dengan implementasi MVP saat menulis bab "Perubahan Desain".

## Yang dipindah ke sini

```
_legacy/
├── app/
│   ├── register/                  # Halaman register sertifikat lama (manual ID + CID)
│   └── api/
│       └── certificates/          # API blockchain-based (register / verify / list)
├── components/
│   ├── register-form.tsx          # Form sertifikat (NIM-less, ID-based)
│   ├── history-table.tsx          # Tabel riwayat sertifikat blockchain
│   ├── internal-layout.tsx        # Layout "The Professional Ledger"
│   └── sidebar.tsx                # Sidebar publik versi lama
└── lib/
    ├── blockchain.ts              # Wrapper Ethers.js → CertificateRegistry contract
    ├── contract.ts                # ABI smart contract
    ├── format.ts                  # truncateCid helper
    └── mock-data.ts               # Data dummy sebelum Prisma di-wire
```

## Penggantinya di MVP

| Lama (legacy) | Baru (MVP) |
|---|---|
| `app/register/page.tsx` | `app/admin/documents/create/page.tsx` |
| `app/api/certificates/register` | `POST /api/documents` |
| `app/api/certificates/verify` | `POST /api/verify` |
| `app/api/certificates/route.ts` | `GET /api/documents` (admin) + `GET /api/verifications?scope=public` |
| `lib/blockchain.ts` (Ethers + Sepolia) | `lib/db.ts` (Prisma) sebagai sumber kebenaran utama. Pinata IPFS via `lib/pinata.ts` (opsional). |
| `lib/mock-data.ts` | `prisma/seed.ts` |
| `components/history-table.tsx` | Tabel inline di `app/admin/verifications/page.tsx` & `app/history/page.tsx` |
| `components/internal-layout.tsx` | `components/admin-layout.tsx` (admin) + `components/navigation.tsx` (publik) |

## Status

Folder ini **tidak di-import** dari kode aktif manapun. Aman untuk dihapus permanen kalau riwayatnya sudah ditulis ulang di laporan akhir. Smart contract Solidity (`contracts/CertificateRegistry.sol`) dan Hardhat workflow masih dipertahankan di root proyek sebagai bonus layer terpisah.
