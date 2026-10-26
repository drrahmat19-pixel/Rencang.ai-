import type { Metadata } from "next";
import { Card, StatCard } from "@/components/ui/card";
import { formatRupiah } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/roles";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Beranda" };


export default async function BerandaPage() {
  const tenant = await requireTenant();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-accent text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted">Masuk sebagai {ROLE_LABEL[tenant.role]}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Penjualan hari ini" value={formatRupiah(0)} />
        <StatCard label="Jumlah transaksi" value="0" />
        <StatCard label="Stok menipis" value="0" />
      </div>
      <Card>
        <p className="font-semibold">Belum ada data</p>
        <p className="mt-1 text-sm text-muted">
          Ringkasan penjualan dan stok akan muncul di sini setelah Anda mulai mencatat.
        </p>
      </Card>
    </div>
  );
}
