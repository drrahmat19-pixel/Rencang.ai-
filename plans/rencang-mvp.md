# Plan: Rencang AI MVP — Dashboard + Kasir/POS + Produk & Stok

> Source PRD: plans/prd-rencang-mvp.md · Desain: plans/desain-terkunci-rencang-mvp.md (sementara) · Konteks: plans/konteks.md

## Architectural decisions
- **Routes (UI)**: `/daftar`, `/masuk`, `/pilih-usaha`, lalu di bawah shell dashboard: `/beranda`, `/kasir`, `/kasir/riwayat`, `/kasir/struk/[id]` (layout cetak), `/produk`, `/produk/[id]`, `/stok` (saldo + mutasi), `/laporan`, `/pengaturan` (usaha, tim, batas diskon, audit), placeholder `/pelanggan`, `/pesan`, `/kang-bisa`.
- **Data access**: baca via Supabase client + RLS; semua tulis yang menyentuh uang/stok/peran via RPC Postgres (SECURITY DEFINER, cek `auth.uid()` + peran di dalam fungsi). Tenant aktif dikirim sebagai parameter `p_tenant_id` dan diverifikasi keanggotaannya di fungsi/RLS.
- **Schema**: `tenants`, `memberships`, `locations`, `tenant_settings`, `audit_events`, `products`, `stock_movements`, `stock_balances`, `sales`, `sale_items`, `void_requests` (detail kolom: PRD §Keputusan Implementasi).
- **RPC**: `create_tenant`, `upsert_product`, `inventory_stock_in`, `inventory_adjust`, `inventory_reconcile`, `pos_checkout`, `pos_void`, `pos_request_void`, `report_summary`, `report_sales`. Kode error string tetap → teks Indonesia di satu pemeta.
- **Harga modal tersembunyi**: kolom `cost` tidak dibaca langsung oleh kasir/staf_stok → akses produk lewat view/RPC yang menyamarkan `cost` sesuai peran.
- **Tambah anggota**: server action dengan service role (`auth.admin.createUser`) hanya untuk Owner; key service role hanya di server env.
- Migrasi bernomor `supabase/migrations/0001_…` — dicek terhadap `origin/main` dan log migrasi produksi sebelum memilih nomor (saat ini repo baru, belum ada remote/produksi).

---

## Phase 1: Fondasi — daftar, buat usaha, shell dashboard
**Jenis**: campuran
**User stories**: 1, 4, 5, 43, 44

### What to build
Scaffold Next.js 16 + Supabase + Vitest + harness PGlite (shim auth). Migrasi tenancy (tenants, memberships, locations, tenant_settings, audit_events) + helper RLS. Pengguna mendaftar, membuat usaha (otomatis jadi owner + lokasi default + pengaturan default), masuk, memilih usaha bila lebih dari satu, lalu melihat shell dashboard dengan 8 menu (placeholder "Segera" untuk Pelanggan/Pesan/Kang Bisa) yang responsif.

### Acceptance criteria
- [ ] Daftar → buat usaha → mendarat di `/beranda` dengan nama usaha tampil; peran owner tercatat.
- [ ] Pengguna tanpa sesi yang membuka `/beranda` diarahkan ke `/masuk`.
- [ ] Tes PGlite: user tenant A tidak bisa membaca baris tenant B di semua tabel fase ini; migrasi diterapkan 2× tetap lolos.
- [ ] Shell dashboard tanpa scroll horizontal di 360 px; sidebar di ≥ 1024 px, bottom bar di HP.
- [ ] typecheck, test, build hijau.

---

## Phase 2: Tim & peran
**Jenis**: campuran
**User stories**: 2, 3, 5

### What to build
Owner menambahkan anggota (email + kata sandi sementara + peran admin/kasir/staf_stok) dan menonaktifkannya dari `/pengaturan`. Menu & tombol mengikuti peran; server menolak aksi tanpa izin. Seed/dev: satu usaha demo dengan 4 akun uji (per peran) untuk smoke fase berikutnya.

### Acceptance criteria
- [ ] Owner menambah akun kasir; kasir bisa masuk dan hanya melihat menu sesuai perannya.
- [ ] Anggota yang dinonaktifkan tidak bisa mengakses data usaha (RLS menolak) walau sesinya masih ada.
- [ ] Non-owner yang memanggil aksi tambah/nonaktifkan anggota ditolak `FORBIDDEN`.
- [ ] Perubahan peran/status anggota tercatat di `audit_events`.

---

## Phase 3: Katalog produk
**Jenis**: campuran
**User stories**: 7, 8, 9, 10, 11, 12

### What to build
Tabel `products` + RLS + RPC `upsert_product`. Halaman `/produk`: daftar dengan cari/saring (nama, SKU, kategori, status aktif), form tambah/ubah (barang dilacak stok / jasa), nonaktifkan. Harga modal disamarkan untuk kasir/staf_stok. Perubahan harga jual/modal masuk audit.

### Acceptance criteria
- [ ] Owner membuat produk barang & jasa; muncul di daftar dan bisa dicari via SKU.
- [ ] SKU yang sama dengan produk aktif lain di tenant yang sama ditolak dengan pesan jelas; SKU sama di tenant lain diizinkan.
- [ ] Kasir melihat daftar produk tanpa nilai harga modal (API juga tidak mengembalikannya) dan tidak bisa menyimpan perubahan.
- [ ] Mengubah harga menghasilkan audit event berisi nilai lama & baru.

---

## Phase 4: Stok — buku mutasi
**Jenis**: campuran
**User stories**: 13, 14, 15, 16, 17, 18, 19, 20

### What to build
Tabel `stock_movements` + `stock_balances` + RPC stok masuk/stok awal, koreksi (alasan wajib; staf_stok hanya pengurangan), dan rekonsiliasi. Halaman `/stok`: saldo per produk dengan badge Aman/Stok menipis/Habis, form stok masuk & koreksi, riwayat mutasi (jenis, qty, sumber, pelaku, waktu), tombol "Cek kecocokan stok".

### Acceptance criteria
- [ ] Stok masuk 10 → saldo 10 dan satu baris mutasi `in` +10 dengan pelaku & catatan.
- [ ] Koreksi yang membuat saldo negatif ditolak; koreksi tanpa alasan ditolak; staf_stok menambah via koreksi ditolak.
- [ ] Produk jasa tidak bisa diberi mutasi stok.
- [ ] Produk dengan saldo ≤ min_stock tampil "Stok menipis", saldo 0 "Habis".
- [ ] Rekonsiliasi menampilkan 0 selisih setelah serangkaian mutasi; tes yang sengaja merusak cache menunjukkan selisihnya.

---

## Phase 5: Kasir — checkout atomik + struk
**Jenis**: campuran
**User stories**: 6, 21, 22, 23, 24, 25, 26, 27, 28, 29, 34

### What to build
Tabel `sales` + `sale_items` + RPC `pos_checkout` (idempotency, harga dari server, kunci stok berurutan, tolak stok kurang, batas diskon per peran, snapshot harga/modal, mutasi `sale`, nomor struk per tenant). Pengaturan batas diskon kasir. Halaman `/kasir`: cari produk, keranjang (qty, hapus, sisa stok), diskon nominal, metode tunai/transfer/QRIS + uang diterima & kembalian, konfirmasi bila `PRICE_CHANGED`, lalu struk cetak 58/80 mm dengan keterangan "metode bayar dicatat, bukan bukti dana diterima".

### Acceptance criteria
- [x] Jual 2 produk barang + 1 jasa tunai → satu sale completed, saldo barang berkurang tepat sesuai qty, jasa tanpa mutasi, struk tampil & bisa dicetak.
- [x] Panggilan ulang dengan `idempotency_key` sama → sale yang sama dikembalikan, tidak ada mutasi tambahan (tes).
- [x] Qty melebihi saldo → ditolak `INSUFFICIENT_STOCK`, tidak ada sale/mutasi tersimpan (tes rollback).
- [x] Diskon kasir di atas batas ditolak; owner bisa diskon lebih besar.
- [x] Harga produk diubah setelah keranjang dibuat → kasir melihat konfirmasi harga baru sebelum transaksi tersimpan.
- [x] Uang tunai kurang dari total ditolak; kembalian dihitung server.

---

## Phase 6: Riwayat transaksi & pembatalan
**Jenis**: campuran
**User stories**: 30, 31, 32, 33

### What to build
Halaman `/kasir/riwayat`: daftar & cari (nomor struk, tanggal), detail, cetak ulang struk. Kasir mengajukan pembatalan (alasan). Owner/Admin melihat pengajuan dan membatalkan via RPC `pos_void` (alasan wajib, mutasi `void` +, idempoten). Status Dibatalkan tampil di riwayat & struk.

### Acceptance criteria
- [x] Owner membatalkan sale → status Dibatalkan, saldo barang kembali sesuai qty awal, mutasi `void` tercatat dengan pelaku & alasan.
- [x] Pembatalan kedua pada sale yang sama ditolak/no-op; saldo tidak bertambah lagi (tes).
- [x] Kasir tidak bisa membatalkan langsung (`FORBIDDEN`), tapi bisa mengajukan; pengajuan tampil untuk owner.
- [x] Rekonsiliasi stok tetap 0 selisih setelah jual + batal.

---

## Phase 7: Beranda, laporan & log audit
**Jenis**: campuran
**User stories**: 35, 36, 37, 38, 39, 40, 41, 42

### What to build
RPC `report_summary` / `report_sales` (zona waktu tenant, hanya completed, tidak termasuk dibatalkan). `/beranda`: omzet & transaksi hari ini/7 hari, produk terlaris, stok menipis/habis, kartu Pelanggan/Pesan/Kang Bisa "Segera terhubung dengan CRM"; kasir hanya melihat penjualannya sendiri hari ini. `/laporan`: rentang tanggal, definisi omzet tertulis, top produk (qty & nominal), estimasi laba kotor berlabel + tanda produk tanpa modal, laporan stok. `/pengaturan` → log audit.

### Acceptance criteria
- [ ] Setelah 3 sale (1 dibatalkan), omzet & jumlah transaksi Beranda = 2 sale yang selesai; definisi tampil.
- [ ] Transaksi pukul 23.30 WIB masuk hari yang benar (tes batas zona waktu).
- [ ] Estimasi laba kotor = penjualan bersih − modal snapshot; berlabel "Estimasi" dan menandai item tanpa modal.
- [ ] Kasir tidak bisa memanggil laporan omzet penuh (`FORBIDDEN`), hanya ringkasan miliknya.
- [ ] Log audit menampilkan perubahan harga, mutasi manual, pembatalan, dan perubahan peran.

---

## Urutan rilis
- Belum ada lingkungan produksi. Migrasi `supabase/migrations/0001…0007` dijalankan **berurutan di Supabase SQL editor (proyek dev) SEBELUM** menjalankan/deploy kode fase terkait; tiap fase menambah migrasi bernomor berikutnya.
- Env server: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (hanya server, untuk tambah anggota di Phase 2).
- Uji konkuren 2 kasir (unit terakhir) dijalankan di proyek Supabase dev sebelum pilot berbayar (gate PRD §18), karena PGlite satu koneksi.
- Builder menandai di laporan fase bila migrasinya harus mendahului deploy.
