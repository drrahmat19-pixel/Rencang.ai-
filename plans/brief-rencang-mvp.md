# Brief — Rencang AI MVP (POS + Stok + CRM + Kang Bisa)

- **Tujuan:** satu dashboard UMKM single-outlet: kasir mencatat penjualan, stok berkurang tepat sekali dan atomik, pelanggan tertaut, owner lihat omzet/stok menipis/follow-up, Kang Bisa menjawab dari data nyata (read-only + draf berizin).
- **Aktor:** Owner, Admin/CS, Kasir, Staf Stok, Kang Bisa (AI, read-only + usulan). Matriks izin = PRD §8.
- **Konteks:** mulai dari nol, repo baru `C:\project ai\rencang ai`. Sumber lengkap: `plans/prd-sumber-v1.2.md`. Aset brand di `brand/`. Pola stack user di proyek lain: Next.js + Supabase + Vercel.
- **Batasan keras:** stok = ledger `stock_movements` (signed) + cache yang bisa direkonsiliasi; checkout & void atomik dalam 1 transaksi DB dengan idempotency key; harga/total dihitung server; tenant isolation (RLS) termasuk tool AI; stok negatif dilarang; WA/AI mati tidak menghambat kasir; AI tidak mengubah stok/POS/harga.
- **Scope sesi ini (arahan user):** bagian depan (shell dashboard + Beranda) + Produk & Stok + Kasir/POS (+ laporan penjualan/stok). **CRM sudah ada** → disatukan nanti; Pelanggan/Pesan/Kang Bisa cukup titik integrasi (menu + kontrak `customer_id` opsional di sale).
- **Di luar scope (PRD §5):** offline POS, multi-gudang, payment gateway, BOM, batch/expiry, OCR, P&L, marketplace.
- **Output:** web responsif (360 px → desktop), menu: Beranda, Kasir, Produk & Stok, Pelanggan, Pesan, Laporan, Kang Bisa, Pengaturan. Brand: hijau #0E4D3A, emas #D4A956, ivory #F8F5EC, Plus Jakarta Sans + Lora.
- **Asumsi (perlu dikunci):** stack, varian & diskon, struk & pembayaran, integrasi WA & provider AI, urutan modul.
