import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { getSale, PAYMENT_LABEL } from "@/lib/pos";
import { requireTenant } from "@/lib/tenant";
import { PrintButtons } from "./print-button";

export const metadata: Metadata = { title: "Struk transaksi" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { sale, error } = await getSale(tenant.id, id);
  if (!sale && !error) notFound();

  if (error || !sale) {
    return <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card>;
  }

  const completedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(sale.completed_at));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/kasir" className={buttonClass("secondary")}>Transaksi baru</Link>
        <PrintButtons />
      </div>

      <Card className="receipt-print bg-white p-5 text-ink">
        <div className="border-b border-dashed border-line pb-4 text-center">
          <p className="font-accent text-2xl font-bold text-primary">Rencang AI</p>
          <p className="mt-1 font-semibold">{tenant.name}</p>
          <p className="mt-2 text-sm">{sale.receipt_no}</p>
          <p className="text-xs text-muted">{completedAt} WIB</p>
        </div>

        <ul className="divide-y divide-dashed divide-line py-2">
          {sale.items.map((item) => (
            <li key={item.product_id} className="py-3 text-sm">
              <div className="flex justify-between gap-3 font-semibold"><span>{item.name}</span><span>{formatRupiah(item.line_total)}</span></div>
              <p className="mt-1 text-xs text-muted">{item.qty} {item.unit} × {formatRupiah(item.price)} · {item.sku}</p>
            </li>
          ))}
        </ul>

        <dl className="grid gap-2 border-y border-dashed border-line py-4 text-sm">
          <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{formatRupiah(sale.subtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Diskon</dt><dd>−{formatRupiah(sale.discount_total)}</dd></div>
          <div className="flex justify-between gap-3 text-lg font-bold"><dt>Total</dt><dd>{formatRupiah(sale.total)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Metode</dt><dd>{PAYMENT_LABEL[sale.payment_method]}</dd></div>
          {sale.payment_method === "cash" ? (
            <>
              <div className="flex justify-between gap-3"><dt>Diterima</dt><dd>{formatRupiah(sale.amount_received ?? 0)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Kembalian</dt><dd>{formatRupiah(sale.change)}</dd></div>
            </>
          ) : null}
        </dl>

        <div className="pt-4 text-center text-xs text-muted">
          <p>Terima kasih sudah berbelanja.</p>
          <p className="mt-2 font-semibold">Metode bayar dicatat, bukan bukti dana diterima.</p>
        </div>
      </Card>
    </div>
  );
}

