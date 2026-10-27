"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProductListItem } from "@/lib/catalog";
import { formatRupiah } from "@/lib/money";
import type { PaymentMethod } from "@/lib/pos";
import type { Role } from "@/lib/tenant";

type Cart = Record<string, number>;

function parseMoney(value: string): number {
  if (!/^\d+$/.test(value.trim())) return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

export function Cashier({
  products,
  role,
  cashierDiscountLimit,
}: {
  products: ProductListItem[];
  role: Role;
  cashierDiscountLimit: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [discountText, setDiscountText] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedText, setReceivedText] = useState("0");
  const [message, setMessage] = useState<{ text: string; priceChanged?: boolean } | null>(null);
  const attemptKey = useRef<string | null>(null);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    if (!needle) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.category ?? ""].some((value) => value.toLocaleLowerCase("id-ID").includes(needle)),
    );
  }, [products, query]);
  const cartLines = Object.entries(cart).flatMap(([id, quantity]) => {
    const product = productMap.get(id);
    return product ? [{ product, quantity }] : [];
  });
  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = parseMoney(discountText);
  const total = Math.max(0, subtotal - discount);
  const amountReceived = parseMoney(receivedText);
  const change = paymentMethod === "cash" ? Math.max(0, amountReceived - total) : 0;

  function resetAttempt() {
    attemptKey.current = null;
    setMessage(null);
  }

  function setQuantity(product: ProductListItem, next: number) {
    resetAttempt();
    setCart((current) => {
      if (next <= 0) {
        const copy = { ...current };
        delete copy[product.id];
        return copy;
      }
      const safeNext = product.track_stock ? Math.min(next, product.stock_balance) : next;
      return { ...current, [product.id]: Math.max(1, safeNext) };
    });
  }

  function submit(acceptPriceChange = false) {
    if (cartLines.length === 0) {
      setMessage({ text: "Keranjang masih kosong." });
      return;
    }
    if (discount > subtotal) {
      setMessage({ text: "Diskon tidak boleh lebih besar dari subtotal." });
      return;
    }
    if (paymentMethod === "cash" && amountReceived < total) {
      setMessage({ text: "Uang diterima masih kurang dari total belanja." });
      return;
    }
    const idempotencyKey = attemptKey.current ?? crypto.randomUUID();
    attemptKey.current = idempotencyKey;
    setMessage(null);
    startTransition(async () => {
      const result = await checkoutAction({
        items: cartLines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        discount,
        paymentMethod,
        amountReceived: paymentMethod === "cash" ? amountReceived : null,
        idempotencyKey,
        expectedTotal: total,
        acceptPriceChange,
      });
      if (result.ok) {
        router.push(`/kasir/struk/${result.saleId}`);
        return;
      }
      setMessage({ text: result.error, priceChanged: result.code === "PRICE_CHANGED" });
    });
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
      <section aria-labelledby="catalog-title" className="flex min-w-0 flex-col gap-4">
        <Card>
          <h2 id="catalog-title" className="font-semibold">Cari produk</h2>
          <label htmlFor="product-search" className="sr-only">Nama, SKU, atau kategori</label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama, SKU, atau kategori"
            className="mt-3 min-h-11 w-full rounded-control border border-line bg-surface px-3 text-base"
          />
        </Card>

        {visibleProducts.length === 0 ? (
          <Card><p className="text-sm text-muted">Tidak ada produk yang cocok.</p></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => {
              const soldOut = product.track_stock && product.stock_balance <= 0;
              const quantity = cart[product.id] ?? 0;
              return (
                <Card key={product.id} className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex size-11 items-center justify-center rounded-control bg-ivory font-bold text-primary" aria-hidden="true">
                      {product.name.slice(0, 1).toUpperCase()}
                    </div>
                    <h3 className="mt-3 font-bold">{product.name}</h3>
                    <p className="mt-0.5 text-xs text-muted">{product.sku} · {product.category ?? "Tanpa kategori"}</p>
                    <p className="mt-2 font-bold text-primary">{formatRupiah(product.price)}</p>
                    <p className={`mt-1 text-xs ${soldOut ? "text-danger" : "text-muted"}`}>
                      {product.track_stock ? (soldOut ? "Stok habis" : `Sisa ${product.stock_balance} ${product.unit}`) : "Jasa · tanpa stok"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={soldOut}
                    onClick={() => setQuantity(product, quantity + 1)}
                    aria-label={`Tambah ${product.name} ke keranjang`}
                  >
                    {quantity > 0 ? `Tambah lagi · ${quantity}` : soldOut ? "Tidak tersedia" : "Tambah"}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <aside aria-labelledby="cart-title" className="lg:sticky lg:top-5">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="cart-title" className="font-accent text-xl font-bold">Keranjang</h2>
            <span className="text-sm text-muted">{cartLines.reduce((sum, line) => sum + line.quantity, 0)} item</span>
          </div>

          {cartLines.length === 0 ? (
            <div className="rounded-control border border-dashed border-line p-5 text-center text-sm text-muted">
              Pilih produk untuk memulai transaksi.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cartLines.map(({ product, quantity }) => {
                const exceedsStock = product.track_stock && quantity > product.stock_balance;
                return (
                  <li key={product.id} className="py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="text-xs text-muted">{formatRupiah(product.price)} / {product.unit}</p>
                      </div>
                      <p className="shrink-0 font-semibold">{formatRupiah(product.price * quantity)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button type="button" variant="secondary" className="size-11 px-0" onClick={() => setQuantity(product, quantity - 1)} aria-label={`Kurangi ${product.name}`}>−</Button>
                      <input
                        aria-label={`Jumlah ${product.name}`}
                        type="number"
                        min={1}
                        max={product.track_stock ? product.stock_balance : 100000}
                        value={quantity}
                        onChange={(event) => setQuantity(product, Number(event.target.value))}
                        className="min-h-11 w-20 rounded-control border border-line px-2 text-center"
                      />
                      <Button type="button" variant="secondary" className="size-11 px-0" onClick={() => setQuantity(product, quantity + 1)} disabled={product.track_stock && quantity >= product.stock_balance} aria-label={`Tambah ${product.name}`}>+</Button>
                      <button type="button" onClick={() => setQuantity(product, 0)} className="ml-auto min-h-11 px-2 text-sm font-semibold text-danger underline">Hapus</button>
                    </div>
                    {exceedsStock ? <p role="alert" className="mt-1 text-xs text-danger">Jumlah melebihi stok tersedia.</p> : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid gap-3 border-t border-line pt-4">
            <div>
              <label htmlFor="discount" className="text-sm font-semibold">Diskon nominal</label>
              <input
                id="discount"
                type="number"
                min={0}
                step={1}
                value={discountText}
                onChange={(event) => { resetAttempt(); setDiscountText(event.target.value); }}
                className="mt-1 min-h-11 w-full rounded-control border border-line px-3"
              />
              {role === "kasir" ? <p className="mt-1 text-xs text-muted">Batas diskon kasir: {formatRupiah(cashierDiscountLimit)}</p> : null}
            </div>

            <fieldset>
              <legend className="text-sm font-semibold">Metode pembayaran</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["cash", "transfer", "qris"] as const).map((method) => (
                  <label key={method} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-2 text-sm font-semibold ${paymentMethod === method ? "border-primary bg-primary text-on-primary" : "border-line bg-surface"}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => { resetAttempt(); setPaymentMethod(method); }}
                      className="sr-only"
                    />
                    {method === "cash" ? "Tunai" : method === "transfer" ? "Transfer" : "QRIS"}
                  </label>
                ))}
              </div>
            </fieldset>

            {paymentMethod === "cash" ? (
              <div>
                <label htmlFor="amount-received" className="text-sm font-semibold">Uang diterima</label>
                <input
                  id="amount-received"
                  type="number"
                  min={0}
                  step={1}
                  value={receivedText}
                  onChange={(event) => { resetAttempt(); setReceivedText(event.target.value); }}
                  className="mt-1 min-h-11 w-full rounded-control border border-line px-3"
                />
              </div>
            ) : (
              <p className="rounded-control bg-ivory p-3 text-xs text-muted">Metode dicatat oleh kasir dan bukan bukti dana sudah diterima.</p>
            )}
          </div>

          <dl className="grid gap-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Diskon</dt><dd>−{formatRupiah(discount)}</dd></div>
            <div className="flex justify-between gap-3 text-xl font-bold"><dt>Total</dt><dd>{formatRupiah(total)}</dd></div>
            {paymentMethod === "cash" ? <div className="flex justify-between gap-3"><dt className="text-muted">Kembalian</dt><dd className="font-semibold text-success">{formatRupiah(change)}</dd></div> : null}
          </dl>

          {message ? (
            <div role="alert" className={`rounded-control border p-3 text-sm ${message.priceChanged ? "border-warning text-warning" : "border-danger text-danger"}`}>
              <p>{message.text}</p>
              {message.priceChanged ? (
                <Button type="button" variant="secondary" className="mt-3 w-full" disabled={isPending} onClick={() => submit(true)}>
                  Gunakan harga terbaru
                </Button>
              ) : null}
            </div>
          ) : null}

          <Button type="button" className="w-full" disabled={isPending || cartLines.length === 0} onClick={() => submit(false)} aria-busy={isPending}>
            {isPending ? "Menyimpan transaksi…" : `Bayar ${formatRupiah(total)}`}
          </Button>
        </Card>
      </aside>
    </div>
  );
}

