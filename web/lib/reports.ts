import { createClient } from "@/lib/supabase/server";

export type TopProduct = { product_id: string; name: string; qty: number; amount: number };
export type StockSummary = {
  product_id: string;
  name: string;
  sku: string;
  balance: number;
  min_stock: number;
  unit: string;
};
export type DashboardReport = {
  role: string;
  today_revenue: number;
  today_count: number;
  week_revenue: number;
  week_count: number;
  top_products: TopProduct[];
  low_stock: StockSummary[];
  generated_at: string;
};
export type SalesReport = {
  from: string;
  to: string;
  revenue: number;
  transaction_count: number;
  gross_profit_estimate: number;
  missing_cost: boolean;
  daily: { day: string; transaction_count: number; revenue: number }[];
  top_products: TopProduct[];
  stock: StockSummary[];
};
export type AuditEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export async function getDashboardReport(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_dashboard", { p_tenant_id: tenantId });
  return { report: data as DashboardReport | null, error };
}

export async function getSalesReport(tenantId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("report_sales", {
    p_tenant_id: tenantId,
    p_from: from,
    p_to: to,
  });
  return { report: data as SalesReport | null, error };
}

export async function listAuditEvents(tenantId: string, limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("audit_list", { p_tenant_id: tenantId, p_limit: limit });
  return { events: (data ?? []) as AuditEvent[], error };
}
