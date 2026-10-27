import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { getDashboardReport, getSalesReport } from "@/lib/reports";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Laporan" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function localDate(offset = 0) { const d = new Date(Date.now() + 7 * 3600_000); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); }

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const tenant = await requireTenant();
  const params = await searchParams;
  const to = DATE_RE.test(params.to ?? "") ? params.to! : localDate();
  const from = DATE_RE.test(params.from ?? "") ? params.from! : localDate(-6);
  if (tenant.role === "kasir") {
    const { report, error } = await getDashboardReport(tenant.id);
    return <div className="space-y-5"><div><h1 className="font-accent text-2xl font-bold">Ringkasan Kasir</h1><p className="text-sm text-muted">Hanya transaksi Anda sendiri yang ditampilkan.</p></div>{error || !report ? <Card><p className="text-danger">{mapError(error)}</p></Card> : <div className="grid gap-3 sm:grid-cols-2"><Card><p className="text-sm text-muted">Omzet hari ini</p><p className="mt-2 text-3xl font-bold text-primary">{formatRupiah(report.today_revenue)}</p></Card><Card><p className="text-sm text-muted">Transaksi hari ini</p><p className="mt-2 text-3xl font-bold text-primary">{report.today_count}</p></Card></div>}</div>;
  }
  if (tenant.role === "staf_stok") return <Card><h1 className="text-xl font-bold">Laporan</h1><p className="mt-2 text-muted">Peran staf stok dapat melihat data persediaan melalui menu Produk &amp; Stok.</p></Card>;
  const { report, error } = await getSalesReport(tenant.id, from, to);
  return <div className="flex flex-col gap-5">
    <div><h1 className="font-accent text-2xl font-bold">Laporan Usaha</h1><p className="mt-1 text-sm text-muted">Analisis penjualan selesai dan kondisi persediaan dalam zona waktu WIB.</p></div>
    <Card><form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-sm font-semibold">Dari<input type="date" name="from" defaultValue={from} className="mt-1 block min-h-11 w-full rounded-control border border-line px-3" /></label><label className="text-sm font-semibold">Sampai<input type="date" name="to" defaultValue={to} className="mt-1 block min-h-11 w-full rounded-control border border-line px-3" /></label><button className="min-h-11 rounded-control bg-primary px-5 font-semibold text-on-primary">Tampilkan</button></form></Card>
    {error || !report ? <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card> : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Card><p className="text-xs text-muted">Omzet</p><p className="mt-2 text-xl font-bold text-primary">{formatRupiah(report.revenue)}</p></Card><Card><p className="text-xs text-muted">Transaksi</p><p className="mt-2 text-2xl font-bold">{report.transaction_count}</p></Card><Card><p className="text-xs text-muted">Rata-rata struk</p><p className="mt-2 text-xl font-bold">{formatRupiah(report.transaction_count ? report.revenue / report.transaction_count : 0)}</p></Card><Card><p className="text-xs text-muted">Estimasi laba kotor</p><p className="mt-2 text-xl font-bold text-success">{formatRupiah(report.gross_profit_estimate)}</p></Card></div>
      {report.missing_cost ? <p className="rounded-control border border-warning bg-[#fff9e8] p-3 text-sm text-warning">Estimasi laba belum lengkap karena ada produk tanpa harga modal.</p> : null}
      <div className="grid gap-4 xl:grid-cols-2"><Card><h2 className="text-lg font-bold">Penjualan harian</h2><div className="mt-3 divide-y divide-line">{report.daily.length === 0 ? <p className="py-3 text-sm text-muted">Belum ada penjualan.</p> : report.daily.map((day) => <div key={day.day} className="flex justify-between gap-3 py-3 text-sm"><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(`${day.day}T00:00:00+07:00`))}<br/><span className="text-xs text-muted">{day.transaction_count} transaksi</span></span><strong>{formatRupiah(day.revenue)}</strong></div>)}</div></Card><Card><h2 className="text-lg font-bold">Produk terlaris</h2><div className="mt-3 divide-y divide-line">{report.top_products.length === 0 ? <p className="py-3 text-sm text-muted">Belum ada produk terjual.</p> : report.top_products.map((item) => <div key={item.product_id} className="flex justify-between gap-3 py-3 text-sm"><span className="font-semibold">{item.name}<br/><span className="text-xs font-normal text-muted">{item.qty} terjual</span></span><strong>{formatRupiah(item.amount)}</strong></div>)}</div></Card></div>
      <Card><h2 className="text-lg font-bold">Ringkasan stok</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{report.stock.map((item) => <div key={item.product_id} className="flex justify-between rounded-control border border-line p-3 text-sm"><span><strong>{item.name}</strong><br/><span className="text-xs text-muted">{item.sku}</span></span><span className={item.balance <= item.min_stock ? "font-bold text-warning" : "font-bold text-success"}>{item.balance} {item.unit}</span></div>)}</div></Card>
    </>}
  </div>;
}
