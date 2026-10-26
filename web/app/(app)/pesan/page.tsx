import type { Metadata } from "next";
import { Placeholder } from "@/components/shell/placeholder";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Pesan" };

export default async function Page() {
  await requireTenant();
  return <Placeholder title="Pesan" message="Segera terhubung dengan CRM" />;
}
