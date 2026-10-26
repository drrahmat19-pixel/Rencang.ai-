# Desain terkunci — SEMENTARA
Sumber: PRD v1.2 §19 + `brand/Rencang AI Visual Brand Blueprint.png`. **Visual final dari Google Stitch menyusul** → saat ekspor tiba, kartu ini diganti dan hanya lapisan tema/komponen yang di-reskin.

## Token (CSS variables di satu file tema, dipakai via Tailwind 4 `@theme`)
- Warna: primer Rencang Green `#0E4D3A` · aksen Sunda Gold `#D4A956` · latar Warm Ivory `#F8F5EC` · teks Charcoal `#2D2D2D` · permukaan kartu `#FFFFFF` · garis `#E5E0D3` · sukses `#1F7A4D` · peringatan (stok menipis) `#B7791F` · bahaya (habis/batal) `#B42318`.
- Font: Plus Jakarta Sans (UI, semua teks) · Lora (aksen: judul halaman/sapaan saja). Skala 12/14/16/20/24/32.
- Spacing kelipatan 4 · radius 12 (kartu), 8 (input/tombol) · shadow halus satu level.

## Komponen (satu folder komponen UI, tanpa library UI berat)
- Tombol: primer hijau teks putih, sekunder garis hijau, bahaya merah; tinggi ≥ 44 px (sentuh).
- Kartu ringkasan: angka besar + label + tautan "Lihat detail".
- Badge status stok: Aman / Stok menipis (emas) / Habis (merah); status transaksi: Selesai / Dibatalkan.
- Form: label di atas, pesan error di bawah field, bahasa Indonesia.
- Nav: sidebar kiri di desktop (≥ 1024 px), bottom bar 5 menu utama + "Lainnya" di HP. Menu: Beranda, Kasir, Produk & Stok, Pelanggan, Pesan, Laporan, Kang Bisa, Pengaturan. Menu placeholder bertanda "Segera".
- Kasir: dua kolom di desktop (cari produk | keranjang), satu kolom + keranjang sticky di HP.

## Aturan
- Mobile-first (360 px), kontras WCAG AA, fokus keyboard terlihat, alt text.
- Jangan menambah warna/font di luar token. Gambar produk belum ada → blok warna inisial produk.
- Reviewer UI dilewati sampai kartu Stitch tersedia; hanya cek fungsional & responsif.
