import { createClient } from "@/lib/supabase/server";

export type PaymentMethod = "cash" | "transfer" | "qris";

export type SaleItem = {
  product_id: string;
  sku: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  line_total: number;
};

export type SaleReceipt = {
  id: string;
  receipt_no: string;
  subtotal: number;
  discount_total: number;
  total: number;
  payment_method: PaymentMethod;
  amount_received: number | null;
  change: number;
  status: "completed" | "voided";
  completed_at: string;
  voided_at: string | null;
  void_reason: string | null;
  void_request_status: "pending" | "approved" | "rejected" | null;
  items: SaleItem[];
};

export type SaleListItem = {
  id: string;
  receipt_no: string;
  total: number;
  payment_method: PaymentMethod;
  status: "completed" | "voided";
  completed_at: string;
  cashier_id: string | null;
  item_count: number;
  void_request_status: "pending" | "approved" | "rejected" | null;
};

export async function getPosSettings(tenantId: string): Promise<{ cashierDiscountLimit: number; error: unknown }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("kasir_discount_limit")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { cashierDiscountLimit: Number(data?.kasir_discount_limit ?? 0), error };
}

export async function getSale(tenantId: string, saleId: string): Promise<{ sale: SaleReceipt | null; error: unknown }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pos_get_sale", { p_tenant_id: tenantId, p_sale_id: saleId });
  return { sale: data ? (data as SaleReceipt) : null, error };
}

export async function listSales(
  tenantId: string,
  filters: { query?: string; from?: string; to?: string },
): Promise<{ sales: SaleListItem[]; error: unknown }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pos_list_sales", {
    p_tenant_id: tenantId,
    p_query: filters.query || null,
    p_from: filters.from || null,
    p_to: filters.to || null,
  });
  return { sales: (data ?? []) as SaleListItem[], error };
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai",
  transfer: "Transfer",
  qris: "QRIS",
};

