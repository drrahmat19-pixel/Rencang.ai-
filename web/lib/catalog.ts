import { createClient } from "@/lib/supabase/server";

export type ProductListItem = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  track_stock: boolean;
  price: number;
  cost: number | null;
  min_stock: number;
  is_active: boolean;
  stock_balance: number;
};

export async function listProducts(tenantId: string): Promise<{ products: ProductListItem[]; error: unknown }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("catalog_list_products", { p_tenant_id: tenantId });
  return { products: (data ?? []) as ProductListItem[], error };
}

export function stockStatus(product: ProductListItem): "service" | "empty" | "low" | "safe" {
  if (!product.track_stock) return "service";
  if (product.stock_balance === 0) return "empty";
  if (product.stock_balance <= product.min_stock) return "low";
  return "safe";
}
