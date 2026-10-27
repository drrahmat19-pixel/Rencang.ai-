# Rencang AI

Aplikasi operasional UMKM berbasis Next.js, TypeScript, dan PostgreSQL. Backend saat ini menggunakan Supabase agar autentikasi, Row Level Security (RLS), dan RPC database tetap berada dekat dengan PostgreSQL.

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

