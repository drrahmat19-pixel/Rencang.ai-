import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { listProducts, stockStatus } from "@/lib/catalog";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { requireTenant } from "@/lib/tenant";
import { ProductForm } from "./product-form";
import { StockAdjustForm } from "./stock-adjust-form";
import { StockInForm } from "./stock-in-form";
import { ProductEditForm } from "./product-edit-form";
import { listStockMovements, reconcileInventory } from "@/lib/inventory";

export const metadata: Metadata = { title: "Produk & Stok" };

const STATUS = {
  service: { label: "Jasa", className: "border-line text-muted" },
  safe: { label: "Aman", className: "border-success text-success" },
  low: { label: "Stok menipis", className: "border-warning text-warning" },
  empty: { label: "Habis", className: "border-danger text-danger" },
};

export default async function ProductPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const tenant = await requireTenant();
  const { products, error } = await listProducts(tenant.id);
  const { movements } = await listStockMovements(tenant.id, 30);
  const reconciliation = tenant.role === "owner" ? await reconcileInventory(tenant.id) : null;
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "all";
  const visibleProducts = products.filter((product) => {
    const matchesText = !query || `${product.name} ${product.sku} ${product.category ?? ""}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || (statusFilter === "inactive" ? !product.is_active : product.is_active && stockStatus(product) === statusFilter);
    return matchesText && matchesStatus;
  });
  const canManageCatalog = tenant.role === "owner" || tenant.role === "admin";
  const canAddStock = canManageCatalog || tenant.role === "staf_stok";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-accent text-2xl font-bold">Produk & Stok</h1>
        <p className="mt-1 text-sm text-muted">Kelola katalog dan catat setiap stok masuk tanpa menghapus riwayat.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><p className="text-xs text-muted">Total produk</p><p className="mt-1 text-2xl font-bold">{products.length}</p></Card>
        <Card><p className="text-xs text-muted">Stok aman</p><p className="mt-1 text-2xl font-bold text-success">{products.filter((p) => p.is_active && stockStatus(p) === "safe").length}</p></Card>
        <Card><p className="text-xs text-muted">Perlu dicek</p><p className="mt-1 text-2xl font-bold text-warning">{products.filter((p) => p.is_active && ["low", "empty"].includes(stockStatus(p))).length}</p></Card>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-[1fr_12rem_auto]">
          <input name="q" defaultValue={params.q} placeholder="Cari nama, SKU, atau kategori…" className="min-h-11 rounded-control border border-line px-3" />
          <select name="status" defaultValue={statusFilter} className="min-h-11 rounded-control border border-line bg-surface px-3">
            <option value="all">Semua status</option><option value="safe">Stok aman</option><option value="low">Stok menipis</option><option value="empty">Stok habis</option><option value="service">Jasa</option><option value="inactive">Nonaktif</option>
          </select>
          <button className="min-h-11 rounded-control bg-primary px-4 font-semibold text-on-primary">Cari</button>
        </form>
      </Card>

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
      ) : visibleProducts.length === 0 ? (
        <Card>
          <p className="font-semibold">Belum ada produk</p>
          <p className="mt-1 text-sm text-muted">Tambahkan produk pertama agar dapat digunakan di kasir.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleProducts.map((product) => {
            const status = STATUS[stockStatus(product)];
            return (
              <Card key={product.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{product.name}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                      {!product.is_active ? <span className="rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-muted">Nonaktif</span> : null}
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
                {canManageCatalog ? <ProductEditForm product={product} /> : null}
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <h2 className="text-xl font-bold">Riwayat pergerakan stok</h2>
        <div className="mt-3 divide-y divide-line">
          {movements.length === 0 ? <p className="py-3 text-sm text-muted">Belum ada pergerakan stok.</p> : movements.map((item) => (
            <div key={item.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]">
              <div><p className="font-semibold">{item.product_name} <span className="font-normal text-muted">({item.product_sku})</span></p><p className="text-xs text-muted">{item.reason ?? item.source_type} · {item.actor_email ?? "Sistem"}</p></div>
              <div className="sm:text-right"><p className={`font-bold ${item.qty_signed >= 0 ? "text-success" : "text-danger"}`}>{item.qty_signed >= 0 ? "+" : ""}{item.qty_signed}</p><time className="text-xs text-muted">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.created_at))}</time></div>
            </div>
          ))}
        </div>
      </Card>

      {reconciliation ? <Card>
        <h2 className="text-xl font-bold">Pemeriksaan konsistensi stok</h2>
        {reconciliation.error ? <p className="mt-2 text-sm text-danger">{mapError(reconciliation.error)}</p> : reconciliation.rows.every((row) => row.difference === 0) ? <p className="mt-2 text-sm text-success">Semua saldo stok cocok dengan riwayat pergerakan.</p> : <div className="mt-3 space-y-2">{reconciliation.rows.filter((row) => row.difference !== 0).map((row) => <p key={row.product_id} className="text-sm text-danger">{row.product_name}: selisih {row.difference}</p>)}</div>}
      </Card> : null}
    </div>
  );
}
