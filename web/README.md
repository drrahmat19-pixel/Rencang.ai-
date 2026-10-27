# Aplikasi web Rencang AI

Frontend dan server actions Rencang AI dibangun dengan Next.js dan TypeScript. Aplikasi terhubung ke PostgreSQL melalui Supabase Auth, RLS, dan RPC.

## Menjalankan lokal

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Pemeriksaan sebelum commit

```bash
npm test
npm run typecheck
npm run lint
npm run build -- --webpack
```

## Database produksi

Panduan self-hosted PostgreSQL/Supabase tersedia di [`../infra/vps/README.md`](../infra/vps/README.md). Jangan memasukkan service-role key atau password database ke repository.
