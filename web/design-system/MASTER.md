# Rencang AI Design System

## Arah visual

**Sunda Editorial Operations**: hangat dan dekat untuk pemilik UMKM, tetapi rapi, presisi, dan terpercaya saat dipakai untuk pekerjaan kasir, stok, laporan, dan tim.

## Prinsip

1. Produk terlihat bekerja: tampilkan data dan alur nyata, bukan klaim pemasaran generik.
2. Satu tindakan utama per area; tindakan sekunder tidak boleh bersaing secara visual.
3. Informasi operasional harus dapat dipindai dalam beberapa detik.
4. Gunakan ruang, tipografi, garis, dan elevasi untuk hierarki; jangan mengandalkan warna saja.
5. CRM, WhatsApp, dan Kang Bisa AI tetap diberi label pratinjau sampai backend siap.

## Fondasi visual

- Primary: `#0B4F3C`; deep: `#062F25`; soft: `#E5F1EB`
- Accent: `#D5AA55`; soft: `#FBF2DC`
- Canvas: `#F7F4EB`; surface: `#FFFEFA`; ink: `#17241F`; muted: `#5C6963`
- Heading: Lora; body: Plus Jakarta Sans
- Spacing: kelipatan 4/8; radius kontrol 12px; radius kartu 20px
- Motion: 150–300ms untuk interaksi; dekorasi lambat maksimal 6 detik dan wajib patuh `prefers-reduced-motion`

## Aturan komponen

- Target sentuh minimum 44×44px dan jarak minimal 8px.
- Ikon menggunakan SVG garis konsisten; tidak memakai emoji sebagai ikon struktural.
- Kartu utama menggunakan permukaan solid. Efek kaca hanya untuk lapisan promosi/hero dan harus menjaga kontras.
- Semua input mempunyai label, focus ring, pesan kesalahan, dan state nonaktif yang jelas.
- Mobile-first pada 375px, lalu 768px, 1024px, dan 1440px.

## Anti-pattern

- Grid berisi kartu generik yang berulang tanpa alur cerita.
- Klaim, angka, testimoni, atau logo pelanggan yang tidak terverifikasi.
- Animasi cepat, transform yang membuat layout bergeser, dan blur di belakang teks kecil.
- Warna emas untuk teks panjang di atas latar terang.
