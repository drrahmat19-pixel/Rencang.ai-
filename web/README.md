# Aplikasi web Rencang AI

Frontend dan server actions Rencang AI dibangun dengan Next.js dan TypeScript. Aplikasi terhubung ke PostgreSQL melalui Supabase Auth, RLS, dan RPC.

## Menjalankan lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Isi tiga variabel pada `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` hanya dibaca server dan diperlukan agar pemilik dapat membuat akun anggota tim.

Buka `http://localhost:3000`.

Untuk meninjau tampilan sebelum database VPS tersedia, buka `http://localhost:3000/demo`. Data pada halaman ini hanya contoh dan tidak disimpan.

Halaman `/panduan` menjelaskan alur tiap peran. PWA dan cache offline aktif pada build produksi; service worker sengaja tidak didaftarkan saat mode pengembangan agar hot reload tetap bersih.

## Pemeriksaan sebelum commit

```bash
npm test
npm run typecheck
npm run lint
npm run build -- --webpack
```

## Database produksi

Panduan self-hosted PostgreSQL/Supabase tersedia di [`../infra/vps/README.md`](../infra/vps/README.md). Jangan memasukkan service-role key atau password database ke repository.
