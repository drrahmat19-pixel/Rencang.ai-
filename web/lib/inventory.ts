import { createClient } from "@/lib/supabase/server";

export type StockMovement = {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  type: string;
  qty_signed: number;
  source_type: string;
  reason: string | null;
  actor_email: string | null;
  created_at: string;
};

export type ReconciliationRow = {
  product_id: string;
  product_name: string;
  balance: number;
  ledger_balance: number;
  difference: number;
};

export async function listStockMovements(tenantId: string, limit = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inventory_list_movements", {
    p_tenant_id: tenantId,
    p_limit: limit,
  });
  return { movements: (data ?? []) as StockMovement[], error };
}

export async function reconcileInventory(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("inventory_reconcile", { p_tenant_id: tenantId });
  return { rows: (data ?? []) as ReconciliationRow[], error };
}
