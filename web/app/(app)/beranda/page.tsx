import type { Metadata } from "next";
import { Card, StatCard } from "@/components/ui/card";
import { listProducts, stockStatus } from "@/lib/catalog";
import { formatRupiah } from "@/lib/money";
import { ROLE_LABEL } from "@/lib/roles";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Beranda" };


export default async function BerandaPage() {
  const tenant = await requireTenant();
  const { products } = await listProducts(tenant.id);
  const lowStock = products.filter((product) => {
    const status = stockStatus(product);
    return status === "low" || status === "empty";
  });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-accent text-2xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-muted">Masuk sebagai {ROLE_LABEL[tenant.role]}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Penjualan hari ini" value={formatRupiah(0)} />
        <StatCard label="Jumlah transaksi" value="0" />
        <StatCard label="Stok menipis/habis" value={String(lowStock.length)} href="/produk" />
      </div>
      <Card>
        <p className="font-semibold">{lowStock.length > 0 ? "Perlu perhatian" : "Kondisi stok aman"}</p>
        <p className="mt-1 text-sm text-muted">
          {lowStock.length > 0
            ? `${lowStock.length} produk perlu diperiksa atau segera diisi ulang.`
            : "Produk yang mencapai batas minimum akan muncul di sini."}
        </p>
      </Card>
    </div>
  );
}
