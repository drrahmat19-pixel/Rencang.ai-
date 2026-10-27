import Link from "next/link";
import type { Metadata } from "next";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { listSales, PAYMENT_LABEL } from "@/lib/pos";
import { requireTenant } from "@/lib/tenant";
import { VoidForm } from "./void-form";

export const metadata: Metadata = { title: "Riwayat transaksi" };

function one(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function validDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requireTenant();
  if (tenant.role === "staf_stok") {
    return <Card><p role="alert" className="text-danger">{mapError("FORBIDDEN")}</p></Card>;
  }
  const params = await searchParams;
  const query = one(params.q).trim().slice(0, 80);
  const from = validDate(one(params.from));
  const to = validDate(one(params.to));
  const { sales, error } = await listSales(tenant.id, { query, from, to });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-accent text-2xl font-bold">Riwayat transaksi</h1>
          <p className="mt-1 text-sm text-muted">Cari struk, cetak ulang, atau proses pembatalan dengan histori yang tetap utuh.</p>
        </div>
        <Link href="/kasir" className={buttonClass("primary")}>Transaksi baru</Link>
      </div>

      <Card>
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_10rem_10rem_auto] md:items-end">
          <div>
            <label htmlFor="q" className="text-sm font-semibold">Nomor struk</label>
            <input id="q" name="q" type="search" defaultValue={query} placeholder="Contoh: STR-20261027" className="mt-1 min-h-11 w-full rounded-control border border-line px-3" />
          </div>
          <div>
            <label htmlFor="from" className="text-sm font-semibold">Dari tanggal</label>
            <input id="from" name="from" type="date" defaultValue={from} className="mt-1 min-h-11 w-full rounded-control border border-line px-3" />
          </div>
          <div>
            <label htmlFor="to" className="text-sm font-semibold">Sampai tanggal</label>
            <input id="to" name="to" type="date" defaultValue={to} className="mt-1 min-h-11 w-full rounded-control border border-line px-3" />
          </div>
          <button type="submit" className={buttonClass("secondary")}>Cari</button>
        </form>
        {!from && !to ? <p className="mt-2 text-xs text-muted">Secara default menampilkan 30 hari terakhir.</p> : null}
      </Card>

      {error ? (
        <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card>
      ) : sales.length === 0 ? (
        <Card>
          <p className="font-semibold">Belum ada transaksi yang cocok</p>
          <p className="mt-1 text-sm text-muted">Ubah kata pencarian atau rentang tanggal.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sales.map((sale) => {
            const completedAt = new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(new Date(sale.completed_at));
            const canVoid = tenant.role === "owner" || tenant.role === "admin";
            return (
              <Card key={sale.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{sale.receipt_no}</h2>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${sale.status === "voided" ? "border-danger text-danger" : "border-success text-success"}`}>
                        {sale.status === "voided" ? "Dibatalkan" : "Selesai"}
                      </span>
                      {sale.void_request_status === "pending" ? <span className="rounded-full border border-warning px-2 py-0.5 text-xs font-semibold text-warning">Perlu persetujuan</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted">{completedAt} WIB · {sale.item_count} jenis item · {PAYMENT_LABEL[sale.payment_method]}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xl font-bold">{formatRupiah(sale.total)}</p>
                    <Link href={`/kasir/struk/${sale.id}`} className="mt-1 inline-block text-sm font-semibold text-primary underline">Lihat struk</Link>
                  </div>
                </div>
                {sale.status === "completed" && sale.void_request_status !== "pending" && !canVoid ? <VoidForm saleId={sale.id} mode="request" /> : null}
                {sale.status === "completed" && canVoid ? <VoidForm saleId={sale.id} mode="void" /> : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

