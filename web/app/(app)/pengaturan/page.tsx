import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/money";
import { getPosSettings } from "@/lib/pos";
import { requireTenant } from "@/lib/tenant";
import { DiscountLimitForm } from "./discount-limit-form";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const tenant = await requireTenant();
  const { cashierDiscountLimit } = await getPosSettings(tenant.id);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-accent text-2xl font-bold">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted">Atur kebijakan operasional untuk {tenant.name}.</p>
      </div>
      <Card>
        <h2 className="text-xl font-bold">Diskon transaksi</h2>
        {tenant.role === "owner" ? (
          <DiscountLimitForm currentLimit={cashierDiscountLimit} />
        ) : (
          <p className="mt-2 text-sm text-muted">Batas diskon kasir saat ini: <strong>{formatRupiah(cashierDiscountLimit)}</strong>. Hanya Owner yang dapat mengubahnya.</p>
        )}
      </Card>
      <Card>
        <h2 className="text-xl font-bold">Pengaturan lainnya</h2>
        <p className="mt-2 text-sm text-muted">Pengelolaan tim dan log audit akan tersedia pada fase berikutnya.</p>
      </Card>
    </div>
  );
}
