/**
 * Satu-satunya tempat pemetaan kode error RPC (string tetap dari Postgres) -> teks Indonesia.
 * Tambahkan kode baru di sini saat fase berikutnya menambah RPC.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Sesi Anda sudah berakhir. Silakan masuk lagi.",
  FORBIDDEN: "Anda tidak punya izin untuk melakukan ini.",
  INVALID_NAME: "Nama usaha harus 2 sampai 80 huruf.",
  INVALID_SKU: "SKU hanya boleh memakai huruf, angka, titik, garis miring, garis bawah, atau tanda hubung.",
  INVALID_PRODUCT: "Periksa kembali data produk yang Anda isi.",
  DUPLICATE_SKU: "SKU ini sudah dipakai produk aktif lain.",
  INVALID_AMOUNT: "Jumlah harus lebih dari nol.",
  INVALID_CART: "Keranjang tidak valid. Periksa kembali produk dan jumlahnya.",
  DUPLICATE_PRODUCT: "Produk yang sama muncul lebih dari sekali di keranjang.",
  PRODUCT_NOT_FOUND: "Produk tidak ditemukan atau sudah tidak aktif.",
  LOCATION_NOT_FOUND: "Lokasi utama usaha belum tersedia.",
  TENANT_SETTINGS_NOT_FOUND: "Pengaturan usaha belum tersedia.",
  PRODUCT_NOT_FOUND_OR_STOCK_NOT_TRACKED: "Produk tidak ditemukan atau stoknya tidak dikelola.",
  REASON_REQUIRED: "Alasan koreksi wajib diisi minimal 3 huruf.",
  POSITIVE_ADJUSTMENT_FORBIDDEN: "Staf stok hanya dapat mencatat pengurangan karena rusak atau hilang.",
  INSUFFICIENT_STOCK: "Stok tidak cukup.",
  PRICE_CHANGED: "Harga berubah. Mohon cek ulang total sebelum melanjutkan.",
  INVALID_DISCOUNT: "Diskon tidak valid atau lebih besar dari subtotal.",
  DISCOUNT_LIMIT_EXCEEDED: "Diskon melebihi batas yang diizinkan untuk kasir.",
  INVALID_PAYMENT_METHOD: "Pilih metode pembayaran yang tersedia.",
  INVALID_PAYMENT_AMOUNT: "Nominal pembayaran tidak sesuai dengan metode yang dipilih.",
  INSUFFICIENT_PAYMENT: "Uang diterima masih kurang dari total belanja.",
  INVALID_TOTAL: "Total keranjang tidak valid. Muat ulang halaman lalu coba lagi.",
  INVALID_IDEMPOTENCY_KEY: "Identitas transaksi tidak valid. Coba ulangi pembayaran.",
  SALE_NOT_FOUND: "Transaksi tidak ditemukan.",
  SALE_ALREADY_VOIDED: "Transaksi ini sudah dibatalkan.",
  STOCK_BALANCE_NOT_FOUND: "Saldo stok produk tidak ditemukan.",
  INVALID_DATE_RANGE: "Rentang tanggal tidak valid atau lebih dari satu tahun.",
  // Pesan bawaan Supabase Auth
  "Invalid login credentials": "Email atau kata sandi salah.",
  "User already registered": "Email ini sudah terdaftar. Silakan masuk.",
  "Email not confirmed": "Email belum dikonfirmasi. Cek kotak masuk Anda.",
};

export const FALLBACK_ERROR = "Terjadi kesalahan. Coba lagi sebentar lagi.";

export function errorCode(err: unknown): string | undefined {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : "";
  return Object.keys(ERROR_MESSAGES).find((key) => /^[A-Z_]+$/.test(key) && raw.includes(key));
}

/** Terima error apa pun (Error, objek Supabase { message }, string) dan kembalikan teks Indonesia. */
export function mapError(err: unknown): string {
  const raw =
    typeof err === "string"
      ? err
      : err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
        ? (err as { message: string }).message
        : "";
  if (!raw) return FALLBACK_ERROR;
  if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw];
  const code = errorCode(raw);
  if (code) return ERROR_MESSAGES[code];
  if (/password/i.test(raw) && /(least|short|characters)/i.test(raw)) return "Kata sandi minimal 8 karakter.";
  if (/rate limit/i.test(raw)) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return FALLBACK_ERROR;
}
