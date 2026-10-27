import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { listProducts, stockStatus } from "@/lib/catalog";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { requireTenant } from "@/lib/tenant";
import { ProductForm } from "./product-form";
import { StockAdjustForm } from "./stock-adjust-form";
import { StockInForm } from "./stock-in-form";

export const metadata: Metadata = { title: "Produk & Stok" };

const STATUS = {
  service: { label: "Jasa", className: "border-line text-muted" },
  safe: { label: "Aman", className: "border-success text-success" },
  low: { label: "Stok menipis", className: "border-warning text-warning" },
  empty: { label: "Habis", className: "border-danger text-danger" },
};

export default async function ProductPage() {
  const tenant = await requireTenant();
  const { products, error } = await listProducts(tenant.id);
  const canManageCatalog = tenant.role === "owner" || tenant.role === "admin";
  const canAddStock = canManageCatalog || tenant.role === "staf_stok";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-accent text-2xl font-bold">Produk & Stok</h1>
        <p className="mt-1 text-sm text-muted">Kelola katalog dan catat setiap stok masuk tanpa menghapus riwayat.</p>
      </div>

      {canManageCatalog ? (
        <Card>
          <details>
            <summary className="cursor-pointer font-semibold text-primary">Tambah produk baru</summary>
            <div className="mt-4"><ProductForm /></div>
          </details>
        </Card>
      ) : null}

      {error ? (
        <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card>
      ) : products.length === 0 ? (
        <Card>
          <p className="font-semibold">Belum ada produk</p>
          <p className="mt-1 text-sm text-muted">Tambahkan produk pertama agar dapat digunakan di kasir.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const status = STATUS[stockStatus(product)];
            return (
              <Card key={product.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{product.name}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{product.sku} · {product.category ?? "Tanpa kategori"}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-bold text-primary">{formatRupiah(product.price)}</p>
                    {product.cost !== null ? <p className="text-xs text-muted">Modal {formatRupiah(product.cost)}</p> : null}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <p><span className="text-muted">Stok:</span> <strong>{product.track_stock ? `${product.stock_balance} ${product.unit}` : "Tidak dikelola"}</strong></p>
                  {product.track_stock ? <p><span className="text-muted">Batas minimum:</span> <strong>{product.min_stock} {product.unit}</strong></p> : null}
                </div>
                {canAddStock && product.track_stock && product.is_active ? <StockInForm productId={product.id} /> : null}
                {canAddStock && product.track_stock && product.is_active ? (
                  <StockAdjustForm productId={product.id} allowPositive={canManageCatalog} />
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
