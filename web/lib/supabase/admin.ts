import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/** Klien administratif khusus server untuk membuat akun anggota tim. */
export function createAdminClient() {
  const { url } = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
