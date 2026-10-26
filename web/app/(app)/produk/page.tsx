import type { Metadata } from "next";
import { Placeholder } from "@/components/shell/placeholder";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Produk & Stok" };

export default async function Page() {
  await requireTenant();
  return <Placeholder title="Produk & Stok" message="Fitur ini sedang disiapkan." />;
}
