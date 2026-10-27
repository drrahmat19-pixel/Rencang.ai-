# Rencang AI

Aplikasi operasional UMKM berbasis Next.js, TypeScript, dan PostgreSQL. Backend saat ini menggunakan Supabase agar autentikasi, Row Level Security (RLS), dan RPC database tetap berada dekat dengan PostgreSQL.

MVP mencakup akun multi-usaha dan tim, katalog serta ledger stok, kasir atomik, struk dan pembatalan, dashboard, laporan, dan log audit. CRM/WhatsApp serta Kang Bisa AI ditampilkan sebagai fitur berikutnya dan tidak mengganggu operasional inti.

## Struktur

- `web/` - aplikasi Next.js
- `supabase/migrations/` - skema dan fungsi PostgreSQL
- `infra/vps/` - panduan self-hosted Supabase/PostgreSQL di VPS
- `plans/` - brief dan PRD produk
- `assets/` - aset brand yang dibantu Rencang AI

## Mulai lokal

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Untuk menyiapkan database produksi milik sendiri, ikuti [panduan VPS](infra/vps/README.md).

## Pratinjau tanpa database

Jalankan aplikasi lalu buka `http://localhost:3000/demo`. Mode ini menampilkan mockup interaktif Beranda, Kasir, Stok, Pelanggan, dan Akun dengan data contoh tanpa memerlukan Supabase.

Panduan penggunaan tersedia di `http://localhost:3000/panduan`. Build produksi juga menyertakan manifest dan service worker agar aplikasi dapat dipasang serta menyediakan halaman publik dasar saat koneksi terputus.

