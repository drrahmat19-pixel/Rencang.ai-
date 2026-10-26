# PRD — Rencang AI MVP: Dashboard + Kasir/POS + Produk & Stok

> Sumber: `plans/prd-sumber-v1.2.md` (PRD v1.2) · Brief: `plans/brief-rencang-mvp.md` · Tanggal: 2026-10-26

## Pernyataan Masalah
Pemilik UMKM satu outlet mencatat penjualan di buku/kalkulator, stok di spreadsheet, dan baru tahu omzet atau barang yang hampir habis saat sudah terlambat. Aplikasi kasir yang ada tidak terhubung dengan stok, atau terlalu rumit seperti mini-ERP. Selisih stok dan transaksi ganda sering terjadi karena pencatatannya terpisah.

## Solusi
Satu dashboard web responsif berisi Beranda, Kasir, Produk & Stok, dan Laporan. Setiap penjualan selesai otomatis mengurangi stok tepat satu kali; pembatalan mengembalikan stok tanpa menghapus histori. Owner melihat omzet, jumlah transaksi, produk terlaris, dan stok menipis dalam satu layar. Menu Pelanggan, Pesan, dan Kang Bisa disiapkan sebagai titik sambung untuk CRM yang sudah ada.

## Cerita Pengguna
Format: *Sebagai <aktor>, saya ingin <fitur>, agar <manfaat>.*

**Akun & akses**
1. Sebagai Owner, saya ingin mendaftar dan membuat usaha (tenant) dengan satu lokasi default, agar bisa mulai tanpa pengaturan rumit.
2. Sebagai Owner, saya ingin menambahkan Admin/Kasir/Staf Stok dengan peran berbeda, agar setiap staf hanya mengerjakan bagiannya.
3. Sebagai Owner, saya ingin menonaktifkan anggota tim, agar mantan staf tidak bisa masuk lagi.
4. Sebagai pengguna, saya ingin masuk dengan email + kata sandi dan memilih usaha bila tergabung di lebih dari satu, agar data usaha tidak tercampur.
5. Sebagai pengguna, saya ingin menu yang tidak diizinkan tidak tampil dan aksinya ditolak server, agar izin tidak bisa diakali dari browser.
6. Sebagai Owner, saya ingin mengatur batas diskon kasir (Rp, default 0), agar diskon tetap terkendali.

**Produk & katalog**
7. Sebagai Owner/Admin, saya ingin menambah produk (SKU, nama, kategori, satuan, harga jual, harga modal, stok minimum, status aktif, jenis barang/jasa), agar katalog siap dipakai kasir.
8. Sebagai Owner/Admin, saya ingin mengubah dan menonaktifkan produk, agar katalog tetap akurat tanpa menghapus histori.
9. Sebagai Owner/Admin, saya ingin SKU ditolak bila sudah dipakai produk aktif lain di usaha saya, agar tidak ada SKU ganda.
10. Sebagai Kasir/Staf Stok, saya ingin melihat produk tanpa bisa melihat/mengubah harga modal, agar data modal terlindungi.
11. Sebagai Owner, saya ingin perubahan harga jual/modal tercatat di log audit, agar tahu siapa mengubah apa.
12. Sebagai pengguna, saya ingin mencari/menyaring produk berdasarkan nama, SKU, kategori, dan status stok, agar cepat menemukan barang.

**Stok**
13. Sebagai Owner/Admin/Staf Stok, saya ingin mengisi stok awal dan stok masuk (jumlah + catatan/sumber), agar saldo sesuai barang fisik.
14. Sebagai Owner/Admin, saya ingin mengoreksi stok (+/−) dengan alasan wajib, agar selisih fisik tercatat dan bisa diaudit.
15. Sebagai Staf Stok, saya ingin koreksi stok saya terbatas pada pengurangan (rusak/hilang), agar kendali tetap di Owner.
16. Sebagai pengguna, saya ingin melihat saldo stok tiap produk beserta riwayat mutasinya (jenis, jumlah, sumber, pelaku, waktu), agar setiap perubahan stok bisa ditelusuri.
17. Sebagai Owner, saya ingin produk dengan saldo ≤ stok minimum ditandai "Stok menipis" dan saldo 0 ditandai "Habis", agar tahu kapan harus restok.
18. Sebagai sistem, saya ingin mutasi keluar/koreksi yang membuat saldo negatif ditolak, agar stok tidak pernah minus.
19. Sebagai Owner, saya ingin menjalankan "Cek kecocokan stok" yang menghitung ulang saldo dari riwayat mutasi dan menampilkan selisihnya dengan saldo tersimpan, agar saldo stok terbukti benar.
20. Sebagai sistem, saya ingin produk jasa tidak pernah memiliki mutasi stok, agar layanan bisa dijual tanpa stok.

**Kasir / POS**
21. Sebagai Kasir, saya ingin mencari produk aktif, menambahkannya ke keranjang, mengubah jumlah, dan menghapus baris, agar transaksi cepat.
22. Sebagai Kasir, saya ingin melihat sisa stok di keranjang dan diberi peringatan bila jumlah melebihi stok, agar tidak menjual barang yang tidak ada.
23. Sebagai Kasir, saya ingin memberi diskon nominal per transaksi sampai batas saya (Owner/Admin tanpa batas), agar bisa melayani tawar-menawar wajar.
24. Sebagai Kasir, saya ingin memilih metode bayar tunai/transfer/QRIS; untuk tunai saya memasukkan uang diterima dan melihat kembalian, agar pembayaran tercatat benar.
25. Sebagai Kasir, saya ingin transaksi tanpa pelanggan (pembeli langsung) menjadi default, dengan isian pelanggan opsional untuk sambungan CRM, agar antrean tidak melambat.
26. Sebagai Kasir, saya ingin total dihitung ulang oleh server; bila harga berubah sejak keranjang dibuat, saya diminta mengonfirmasi harga akhir, agar tidak ada selisih harga.
27. Sebagai Kasir, saya ingin menekan "Bayar" dua kali atau koneksi yang mengulang permintaan tetap menghasilkan satu transaksi, agar tidak ada penjualan dan potongan stok ganda.
28. Sebagai Kasir, saya ingin transaksi ditolak dengan alasan jelas bila stok tidak cukup (termasuk bila kasir lain baru saja menjual unit terakhir), agar tidak terjadi penjualan ganda atas barang yang sama.
29. Sebagai Kasir, saya ingin mendapat struk setelah transaksi selesai (nomor struk, item, diskon, total, metode, kembalian) yang bisa dicetak 58/80 mm atau disimpan PDF, agar pembeli punya bukti.
30. Sebagai Kasir, saya ingin melihat riwayat transaksi, mencarinya berdasarkan nomor struk/tanggal, dan mencetak ulang struk, agar bisa melayani komplain.
31. Sebagai Kasir, saya ingin mengajukan pembatalan transaksi dengan alasan, agar Owner/Admin bisa memutuskan.
32. Sebagai Owner/Admin, saya ingin membatalkan transaksi selesai dengan alasan wajib, agar stok barang yang dilacak kembali dan laporan terkoreksi.
33. Sebagai sistem, saya ingin pembatalan yang diulang tidak mengembalikan stok dua kali, agar stok tetap benar.
34. Sebagai Owner, saya ingin struk mencantumkan keterangan "metode bayar dicatat, bukan bukti dana diterima", agar tidak ada salah paham soal verifikasi transfer/QRIS.

**Beranda & Laporan**
35. Sebagai Owner, saya ingin Beranda menampilkan omzet & jumlah transaksi hari ini dan 7 hari terakhir, produk terlaris, serta daftar stok menipis/habis, agar tahu kondisi usaha sekilas.
36. Sebagai Owner, saya ingin kartu Pelanggan/Pesan/Kang Bisa di Beranda berstatus "Segera terhubung dengan CRM", agar tata letak siap disatukan.
37. Sebagai Owner/Admin, saya ingin laporan penjualan per rentang tanggal (zona waktu usaha) dengan definisi "omzet = transaksi selesai, tidak termasuk yang dibatalkan", agar angkanya jelas.
38. Sebagai Owner, saya ingin melihat produk terlaris berdasarkan jumlah dan nominal, agar tahu barang andalan.
39. Sebagai Owner, saya ingin melihat "Estimasi laba kotor" = penjualan bersih − modal saat terjual (snapshot), berlabel estimasi dan bertanda bila ada produk tanpa harga modal, agar tidak dikira laba bersih.
40. Sebagai Kasir, saya ingin hanya melihat ringkasan penjualan saya hari ini, agar data omzet penuh tetap milik Owner.
41. Sebagai Owner, saya ingin laporan stok (saldo, stok menipis, riwayat mutasi per periode), agar bisa merencanakan restok.

**Audit & keamanan**
42. Sebagai Owner, saya ingin log audit untuk perubahan harga, mutasi stok manual, pembatalan, pengaturan, dan peran, agar tindakan sensitif bisa ditelusuri.
43. Sebagai sistem, saya ingin semua data dan query dibatasi per tenant (RLS) sehingga tenant A tidak pernah bisa membaca data tenant B, agar data usaha aman.
44. Sebagai pengguna, saya ingin tampilan tetap nyaman dipakai di layar 360 px maupun desktop, agar kasir bisa memakai HP/tablet.

## Keputusan Implementasi
- **Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, RLS) · deploy di Vercel. Monolit modular: modul `catalog`, `inventory`, `pos`, `reports`, `tenancy`.
- **Tenant & hak akses:** tabel `tenants`, `memberships(user_id, tenant_id, role, status)`, `locations` (1 lokasi default). Peran: owner, admin, kasir, staf_stok. Izin per aksi dicek di fungsi Postgres/server, bukan hanya di UI; RLS memakai fungsi bantu `is_member(tenant_id)` / `has_role(...)`. Tenant aktif dipilih per sesi.
- **Skema inti** (semua punya `tenant_id` dan timestamp): `products` (sku, name, category, unit, track_stock, price, cost boleh kosong, min_stock, is_active; unik parsial `(tenant_id, sku) where is_active`), `stock_movements` (product_id, location_id, type ∈ opening/in/adjustment/sale/void, qty_signed, source_type, source_id, reason, actor_id), `stock_balances` (cache, kunci tenant+produk+lokasi), `sales` (receipt_no unik per tenant, customer_id boleh kosong tanpa FK, subtotal, discount_total, total, payment_method ∈ cash/transfer/qris, amount_received, change, status ∈ completed/voided, cashier_id, idempotency_key unik per tenant, completed_at, voided_at, void_reason, voided_by), `sale_items` (snapshot sku/nama/harga/modal, qty, line_total), `void_requests`, `audit_events`, `tenant_settings` (kasir_discount_limit, timezone).
- **Uang:** bilangan bulat Rupiah (tanpa desimal). Jumlah barang: bilangan bulat.
- **Checkout = satu fungsi Postgres** (`pos_checkout`, SECURITY DEFINER + cek peran): cek idempotency (kembalikan transaksi lama bila key sama) → ambil harga dari `products` → kunci baris `stock_balances` dengan `SELECT … FOR UPDATE` berurutan menurut product_id (mencegah deadlock) → tolak bila stok kurang → hitung subtotal/diskon (cek batas peran)/total/kembalian → simpan sale + item (snapshot) + mutasi `sale` (−) + perbarui saldo + audit. Berhasil semua atau batal semua.
- **Harga berubah:** klien mengirim `expected_total`; bila berbeda dari hitungan server → galat `PRICE_CHANGED` + harga baru, klien meminta konfirmasi lalu mengirim ulang dengan key yang sama.
- **Pembatalan = fungsi Postgres** (`pos_void`): hanya owner/admin, alasan wajib, kunci baris sale, tolak bila sudah dibatalkan (idempoten), mutasi `void` (+) per item yang dilacak.
- **Mutasi manual** (`inventory_stock_in`, `inventory_adjust`): fungsi Postgres, menolak saldo negatif, alasan wajib untuk koreksi.
- **Rekonsiliasi:** fungsi baca-saja yang membandingkan `sum(qty_signed)` per produk dengan `stock_balances`.
- **Laporan:** query/view dari `sales` berstatus completed + snapshot `sale_items`; batas tanggal memakai zona waktu tenant (default Asia/Jakarta).
- **Struk:** halaman HTML khusus cetak (CSS `@page` 58/80 mm), tanpa driver printer khusus.
- **Desain:** visual akhir dari Google Stitch menyusul. Sementara memakai token brand PRD v1.2 §19 dalam satu lapisan tema/komponen agar bisa diganti tampilannya tanpa menyentuh logika.
- **Sambungan CRM nanti:** `sales.customer_id` (uuid boleh kosong, tanpa FK); menu Pelanggan/Pesan/Kang Bisa berupa placeholder. Fungsi laporan baca-saja dirancang agar nanti bisa dipakai tool AI.

## Di Luar Cakupan
CRM/pelanggan, inbox WhatsApp, Kang Bisa AI (hanya placeholder) · POS offline · multi-outlet/gudang & transfer stok · payment gateway/verifikasi dana · retur & pengembalian dana · diskon persen/per item · varian sebagai anak produk · impor CSV · pemindai barcode · printer ESC/POS langsung · pajak otomatis · OCR, pengeluaran, laba-rugi · tagihan/langganan · visual akhir (Stitch).

## Catatan Tambahan
- Asumsi: pilot ritel/kelontong; stok negatif dilarang mutlak; zona waktu default Asia/Jakarta; format nomor struk `<PREFIX>-YYYYMMDD-NNNN` per tenant.
- Asumsi: Staf Stok boleh mencatat stok masuk; koreksinya hanya pengurangan (rusak/hilang). Admin mendapat izin default sama dengan Owner, kecuali mengatur peran & batas diskon.
- Asumsi: menambah anggota di MVP = Owner membuat akun email + kata sandi sementara (tanpa email undangan).
- Pertanyaan terbuka: stack & skema CRM yang sudah ada untuk penyatuan; jadwal ekspor desain Stitch.

## Riwayat Perubahan
- (diisi saat implementasi mengubah rencana)
