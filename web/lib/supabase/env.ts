/** Env publik Supabase. Kosong = belum dikonfigurasi (build tetap jalan, halaman menampilkan pesan jelas). */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return { url, key, configured: Boolean(url && key) };
}

export const NOT_CONFIGURED_MESSAGE =
  "Layanan belum disiapkan: isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local.";
