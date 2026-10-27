"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { errorCode, mapError } from "@/lib/errors";
import type { PaymentMethod } from "@/lib/pos";
import { safeNext } from "@/lib/paths";
import { NOT_CONFIGURED_MESSAGE, supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  clearActiveTenantCookie,
  listMyTenants,
  requireTenant,
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

function readInteger(formData: FormData, name: string, nullable = false): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (nullable && raw === "") return null;
  if (!/^\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role !== "owner" && tenant.role !== "admin") return { error: mapError("FORBIDDEN") };

  const params = {
    p_tenant_id: tenant.id,
    p_sku: String(formData.get("sku") ?? ""),
    p_name: String(formData.get("name") ?? ""),
    p_category: String(formData.get("category") ?? ""),
    p_unit: String(formData.get("unit") ?? "pcs"),
    p_track_stock: String(formData.get("product_type") ?? "goods") !== "service",
    p_price: readInteger(formData, "price"),
    p_cost: readInteger(formData, "cost", true),
    p_min_stock: readInteger(formData, "min_stock"),
    p_initial_stock: readInteger(formData, "initial_stock"),
  };
  if (
    [params.p_price, params.p_min_stock, params.p_initial_stock].some(
      (value) => value === null || Number.isNaN(value),
    ) ||
    (params.p_cost !== null && Number.isNaN(params.p_cost))
  ) {
    return { error: mapError("INVALID_PRODUCT") };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("catalog_create_product", params);
  if (error) return { error: mapError(error) };
  revalidatePath("/produk");
  revalidatePath("/beranda");
  return { info: "Produk berhasil ditambahkan." };
}

export async function addStockAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role === "kasir") return { error: mapError("FORBIDDEN") };

  const qty = readInteger(formData, "quantity");
  if (qty === null || Number.isNaN(qty) || qty <= 0) return { error: mapError("INVALID_AMOUNT") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("inventory_stock_in", {
    p_tenant_id: tenant.id,
    p_product_id: productId,
    p_qty: qty,
    p_note: String(formData.get("note") ?? ""),
  });
  if (error) return { error: mapError(error) };
  revalidatePath("/produk");
  revalidatePath("/beranda");
  return { info: "Stok masuk berhasil dicatat." };
}

export async function adjustStockAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role === "kasir") return { error: mapError("FORBIDDEN") };

  const rawQty = String(formData.get("quantity") ?? "").trim();
  const qty = /^-?\d+$/.test(rawQty) ? Number(rawQty) : Number.NaN;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isInteger(qty) || qty === 0) return { error: mapError("INVALID_AMOUNT") };
  if (reason.length < 3) return { error: mapError("REASON_REQUIRED") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("inventory_adjust", {
    p_tenant_id: tenant.id,
    p_product_id: productId,
    p_qty_signed: qty,
    p_reason: reason,
  });
  if (error) return { error: mapError(error) };
  revalidatePath("/produk");
  revalidatePath("/beranda");
  return { info: "Koreksi stok berhasil dicatat." };
}

export type CheckoutInput = {
  items: { productId: string; quantity: number }[];
  discount: number;
  paymentMethod: PaymentMethod;
  amountReceived: number | null;
  idempotencyKey: string;
  expectedTotal: number;
  acceptPriceChange?: boolean;
};

export type CheckoutResult =
  | { ok: true; saleId: string }
  | { ok: false; error: string; code?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Entry point checkout: semua input browser dianggap tidak tepercaya; harga tetap dihitung RPC. */
export async function checkoutAction(input: CheckoutInput): Promise<CheckoutResult> {
  const tenant = await requireTenant();
  if (tenant.role !== "owner" && tenant.role !== "admin" && tenant.role !== "kasir") {
    return { ok: false, error: mapError("FORBIDDEN"), code: "FORBIDDEN" };
  }

  const validItems =
    Array.isArray(input?.items) &&
    input.items.length >= 1 &&
    input.items.length <= 100 &&
    input.items.every(
      (item) => UUID_RE.test(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 100000,
    );
  const validMoney =
    Number.isSafeInteger(input?.discount) &&
    input.discount >= 0 &&
    Number.isSafeInteger(input?.expectedTotal) &&
    input.expectedTotal >= 0 &&
    (input.amountReceived === null || (Number.isSafeInteger(input.amountReceived) && input.amountReceived >= 0));
  if (!validItems || !validMoney || !UUID_RE.test(input?.idempotencyKey ?? "")) {
    return { ok: false, error: mapError("INVALID_CART"), code: "INVALID_CART" };
  }
  if (!(["cash", "transfer", "qris"] as const).includes(input.paymentMethod)) {
    return { ok: false, error: mapError("INVALID_PAYMENT_METHOD"), code: "INVALID_PAYMENT_METHOD" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pos_checkout", {
    p_tenant_id: tenant.id,
    p_items: input.items.map((item) => ({ product_id: item.productId, qty: item.quantity })),
    p_discount: input.discount,
    p_payment_method: input.paymentMethod,
    p_amount_received: input.paymentMethod === "cash" ? input.amountReceived : null,
    p_customer_id: null,
    p_idempotency_key: input.idempotencyKey,
    p_expected_total: input.expectedTotal,
    p_accept_price_change: input.acceptPriceChange ?? false,
  });
  if (error || !data) {
    const code = errorCode(error);
    if (code === "PRICE_CHANGED") revalidatePath("/kasir");
    return { ok: false, error: mapError(error), code };
  }

  const saleId = (data as { sale_id?: unknown }).sale_id;
  if (typeof saleId !== "string" || !UUID_RE.test(saleId)) {
    return { ok: false, error: mapError("SALE_NOT_FOUND"), code: "SALE_NOT_FOUND" };
  }
  revalidatePath("/kasir");
  revalidatePath("/produk");
  revalidatePath("/beranda");
  return { ok: true, saleId };
}

export async function updateCashierDiscountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role !== "owner") return { error: mapError("FORBIDDEN") };
  const limit = readInteger(formData, "cashier_discount_limit");
  if (limit === null || Number.isNaN(limit) || limit < 0 || limit > 1_000_000_000) {
    return { error: mapError("INVALID_DISCOUNT") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_cashier_discount_limit", {
    p_tenant_id: tenant.id,
    p_limit: limit,
  });
  if (error) return { error: mapError(error) };
  revalidatePath("/pengaturan");
  revalidatePath("/kasir");
  return { info: "Batas diskon kasir berhasil disimpan." };
}

function readReason(formData: FormData): string {
  return String(formData.get("reason") ?? "").trim();
}

export async function requestVoidAction(
  saleId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role !== "owner" && tenant.role !== "admin" && tenant.role !== "kasir") {
    return { error: mapError("FORBIDDEN") };
  }
  if (!UUID_RE.test(saleId)) return { error: mapError("SALE_NOT_FOUND") };
  const reason = readReason(formData);
  if (reason.length < 3) return { error: mapError("REASON_REQUIRED") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("pos_request_void", {
    p_tenant_id: tenant.id,
    p_sale_id: saleId,
    p_reason: reason,
  });
  if (error) return { error: mapError(error) };
  revalidatePath("/kasir/riwayat");
  revalidatePath(`/kasir/struk/${saleId}`);
  return { info: "Pengajuan pembatalan sudah dikirim." };
}

export async function voidSaleAction(
  saleId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  if (tenant.role !== "owner" && tenant.role !== "admin") return { error: mapError("FORBIDDEN") };
  if (!UUID_RE.test(saleId)) return { error: mapError("SALE_NOT_FOUND") };
  const reason = readReason(formData);
  if (reason.length < 3) return { error: mapError("REASON_REQUIRED") };
  const supabase = await createClient();
  const { error } = await supabase.rpc("pos_void", {
    p_tenant_id: tenant.id,
    p_sale_id: saleId,
    p_reason: reason,
  });
  if (error) return { error: mapError(error) };
  revalidatePath("/kasir/riwayat");
  revalidatePath(`/kasir/struk/${saleId}`);
  revalidatePath("/produk");
  revalidatePath("/beranda");
  return { info: "Transaksi dibatalkan dan stok sudah dikembalikan." };
}
