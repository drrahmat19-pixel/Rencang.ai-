# Konteks codebase — Rencang AI
- Repo: `C:\project ai\rencang ai` (git, branch `main`, belum ada remote). Proyek baru dari nol.
- Stack: Next.js 16 (App Router, TS, `web/`) + Tailwind 4 + Supabase (`@supabase/ssr`, `@supabase/supabase-js`) + Vitest. Pola sama dengan `C:\project ai\QILENS\web` (boleh dirujuk untuk struktur supabase client/middleware, bukan disalin).
- **Next.js 16 punya breaking changes** — baca panduan terkait di `web/node_modules/next/dist/docs/` sebelum menulis route/middleware/server action.
- Perintah (dari `web/`): dev `npm run dev -- -p 3200` · build `npm run build` · typecheck `npm run typecheck` · test `npm test`.
- Folder: `web/` app Next · `supabase/migrations/NNNN_<nama>.sql` (bernomor 0001…) · `plans/` dokumen · `brand/` aset.
- DB: semua logika uang/stok di fungsi Postgres (RPC) di migrasi; app memanggil via `supabase.rpc`. Setiap tabel operasional punya `tenant_id` + RLS aktif.
- Test DB: tanpa Docker/Supabase CLI/psql → pakai **PGlite** (`@electric-sql/pglite`) di Vitest: jalankan semua migrasi berurutan di atas shim `supabase/test-shim.sql` (schema `auth`, `auth.users`, `auth.uid()` dari `current_setting('request.jwt.claim.sub')`, role `authenticated`). Uji RPC + RLS dengan set claim per user. Konkurensi nyata (2 koneksi) tidak bisa di PGlite → uji logika kunci + catat uji konkuren di Supabase dev.
- Konvensi: UI & pesan error bahasa Indonesia sehari-hari (hindari jargon: "stok masuk", "transaksi selesai", "dibatalkan"); kode/identifier bahasa Inggris. Uang = integer Rupiah, format `Rp1.850.000` lewat satu helper. Kode error RPC berupa string tetap (mis. `INSUFFICIENT_STOCK`, `PRICE_CHANGED`, `FORBIDDEN`) dipetakan ke teks Indonesia di satu tempat.
- Desain: `plans/desain-terkunci-rencang-mvp.md` (SEMENTARA, token brand; visual final dari Stitch menyusul) — semua warna/font lewat token di satu lapisan tema.

## Pola hemat (dibaca semua agen)
- Python tidak terpasang → pakai `node <SD>/scripts/status.mjs` / `ringkas.mjs`; Jev dilewati.
- Laporan agen: tulis ke path file yang diberikan leader (≤ 6 baris), lalu berhenti.
- Verifikasi: typecheck + `npm test` (termasuk tes migrasi PGlite: semua migrasi diterapkan 2× pada DB baru harus tetap lolos = idempoten bila memakai `if not exists`/`create or replace`) + build.
- Smoke test: **test saja** (G3). Tester hanya untuk fase berisiko (2, 5, 6) + regresi akhir. Supabase dev project ada (user) tapi tidak dipakai untuk verifikasi fase; jangan menyentuhnya dari agen.
