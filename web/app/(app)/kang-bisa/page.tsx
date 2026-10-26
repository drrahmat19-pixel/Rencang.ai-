import type { Metadata } from "next";
import { Placeholder } from "@/components/shell/placeholder";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Kang Bisa" };

export default async function Page() {
  await requireTenant();
  return <Placeholder title="Kang Bisa" message="Segera terhubung dengan CRM" />;
}
