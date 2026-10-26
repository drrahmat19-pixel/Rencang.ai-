import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Klien Supabase per-request (membawa sesi user dari cookie). Hanya untuk server. */
export async function createClient() {
  const { url, key, configured } = supabaseEnv();
  if (!configured) throw new Error("SUPABASE_NOT_CONFIGURED");
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component: sesi disegarkan oleh proxy.
        }
      },
    },
  });
}
