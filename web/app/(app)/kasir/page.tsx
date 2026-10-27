import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listProducts } from "@/lib/catalog";
import { mapError } from "@/lib/errors";
import { getPosSettings } from "@/lib/pos";
import { requireTenant } from "@/lib/tenant";
import { Cashier } from "./cashier";

export const metadata: Metadata = { title: "Kasir" };

export default async function CashierPage() {
  const tenant = await requireTenant();
  if (tenant.role === "staf_stok") {
    return (
      <Card>
        <h1 className="font-accent text-2xl font-bold">Kasir</h1>
        <p role="alert" className="mt-2 text-danger">{mapError("FORBIDDEN")}</p>
      </Card>
    );
  }

  const [{ products, error: productError }, { cashierDiscountLimit, error: settingsError }] = await Promise.all([
    listProducts(tenant.id),
    getPosSettings(tenant.id),
  ]);
  const error = productError ?? settingsError;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-accent text-2xl font-bold">Kasir</h1>
          <p className="mt-1 text-sm text-muted">Pilih produk, periksa pembayaran, lalu selesaikan transaksi.</p>
        </div>
        <Link href="/kasir/riwayat" className={buttonClass("secondary")}>Riwayat transaksi</Link>
      </div>
      {error ? (
        <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card>
      ) : (
        <Cashier
          products={products.filter((product) => product.is_active)}
          role={tenant.role}
          cashierDiscountLimit={cashierDiscountLimit}
        />
      )}
    </div>
  );
}
