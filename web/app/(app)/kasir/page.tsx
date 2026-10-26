import type { Metadata } from "next";
import { Placeholder } from "@/components/shell/placeholder";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Kasir" };

export default async function Page() {
  await requireTenant();
  return <Placeholder title="Kasir" message="Fitur ini sedang disiapkan." />;
}
