"use server";

import { redirect } from "next/navigation";
import { mapError } from "@/lib/errors";
import { safeNext } from "@/lib/paths";
import { NOT_CONFIGURED_MESSAGE, supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  clearActiveTenantCookie,
  listMyTenants,
  requireUserId,
  setActiveTenantCookie,
} from "@/lib/tenant";

export type ActionState = { error?: string; info?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!supabaseEnv().configured) return { error: NOT_CONFIGURED_MESSAGE };
  const { email, password } = readCredentials(formData);
  if (!EMAIL_RE.test(email)) return { error: "Isi email dengan benar." };
  if (!password) return { error: "Isi kata sandi." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: mapError(error ?? "Invalid login credentials") };

  const next = safeNext(String(formData.get("next") ?? ""));
  const tenants = await listMyTenants(data.user.id, supabase);
  if (tenants.length === 1) {
    await setActiveTenantCookie(tenants[0].id);
    redirect(next);
  }
  redirect("/pilih-usaha");
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!supabaseEnv().configured) return { error: NOT_CONFIGURED_MESSAGE };
  const { email, password } = readCredentials(formData);
  if (!EMAIL_RE.test(email)) return { error: "Isi email dengan benar." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: mapError(error) };
  if (!data.session) {
    return { info: "Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk." };
  }
  redirect("/pilih-usaha");
}

export async function signOutAction() {
  if (supabaseEnv().configured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearActiveTenantCookie();
  redirect("/masuk");
}

export async function createTenantAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return { error: mapError("INVALID_NAME") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_tenant", { p_name: name });
  if (error || !data) return { error: mapError(error) };

  await setActiveTenantCookie(data as string);
  redirect("/beranda");
}

export async function selectTenantAction(formData: FormData) {
  const userId = await requireUserId();
  const tenantId = String(formData.get("tenant_id") ?? "");
  // Verifikasi keanggotaan di server: tenant yang bukan milik user tidak akan muncul (RLS + filter).
  const tenants = await listMyTenants(userId);
  if (!tenants.some((t) => t.id === tenantId)) redirect("/pilih-usaha");
  await setActiveTenantCookie(tenantId);
  redirect("/beranda");
}
