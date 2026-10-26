import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const TENANT_COOKIE = "rencang_tenant";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type Role = "owner" | "admin" | "kasir" | "staf_stok";
export type TenantChoice = { id: string; name: string; role: Role };
export type ActiveTenant = TenantChoice & { userId: string };

/** User yang sedang login (diverifikasi lewat getClaims), atau null. */
export const getUserId = cache(async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return (data?.claims?.sub as string | undefined) ?? null;
  } catch {
    return null;
  }
});

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/masuk");
  return id;
}

type MembershipRow = { role: Role; tenants: { id: string; name: string } | { id: string; name: string }[] | null };

function toChoices(rows: MembershipRow[] | null): TenantChoice[] {
  return (rows ?? []).flatMap((r) => {
    const t = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
    return t ? [{ id: t.id, name: t.name, role: r.role }] : [];
  });
}

/** Semua usaha tempat user menjadi anggota aktif (RLS membatasi ke milik user). */
export async function listMyTenants(
  userId: string,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<TenantChoice[]> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("memberships")
    .select("role, tenants(id, name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  return toChoices(data as MembershipRow[] | null);
}

/** Simpan tenant aktif ke cookie. Hanya panggil dari Server Action / Route Handler. */
export async function setActiveTenantCookie(tenantId: string) {
  const store = await cookies();
  store.set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearActiveTenantCookie() {
  const store = await cookies();
  store.delete(TENANT_COOKIE);
}

/**
 * Tenant aktif dari cookie, DIVERIFIKASI ke database (keanggotaan aktif milik user ini).
 * Cookie palsu / keanggotaan dinonaktifkan -> null.
 */
export const getActiveTenant = cache(async (): Promise<ActiveTenant | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const store = await cookies();
  const tenantId = store.get(TENANT_COOKIE)?.value;
  if (!tenantId || !/^[0-9a-f-]{36}$/i.test(tenantId)) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, tenants(id, name)")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return null;
  const [choice] = toChoices([data as MembershipRow]);
  return choice ? { ...choice, userId } : null;
});

/** Untuk halaman & aksi di dalam shell: wajib login + tenant aktif valid, kalau tidak redirect. */
export async function requireTenant(): Promise<ActiveTenant> {
  await requireUserId();
  const tenant = await getActiveTenant();
  if (!tenant) redirect("/pilih-usaha");
  return tenant;
}
