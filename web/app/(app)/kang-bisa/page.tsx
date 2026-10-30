import Link from "next/link";
import type { Metadata } from "next";
import { KangBisa } from "@/components/brand/kang-bisa";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import {
  buildFinancialSnapshot,
  buildKangBisaInsights,
  buildPareto,
  summarizeInventory,
  type KangBisaPriority,
} from "@/lib/business-insights";
import { listProducts } from "@/lib/catalog";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { getDashboardReport, getSalesReport } from "@/lib/reports";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Insight Kang Bisa" };

const priorityStyle: Record<KangBisaPriority, { label: string; badge: string; border: string }> = {
  urgent: { label: "Mendesak", badge: "bg-[#fff0e8] text-danger", border: "border-l-danger" },
  attention: { label: "Perlu perhatian", badge: "bg-accent-soft text-warning", border: "border-l-accent" },
  opportunity: { label: "Peluang", badge: "bg-primary-soft text-primary", border: "border-l-primary" },
  positive: { label: "Terkendali", badge: "bg-[#e8f3ed] text-success", border: "border-l-success" },
};

function jakartaDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10);
}

export default async function KangBisaPage() {
  const tenant = await requireTenant();
  const { products, error: productError } = await listProducts(tenant.id);
  const canReadSales = tenant.role === "owner" || tenant.role === "admin";
  const canReadDashboard = canReadSales || tenant.role === "kasir";
  const [{ report: salesReport, error: salesError }, { report: dashboard, error: dashboardError }] = await Promise.all([
    canReadSales ? getSalesReport(tenant.id, jakartaDate(-29), jakartaDate()) : Promise.resolve({ report: null, error: null }),
    canReadDashboard && !canReadSales ? getDashboardReport(tenant.id) : Promise.resolve({ report: null, error: null }),
  ]);
  const inventory = summarizeInventory(products);
  const topProducts = salesReport?.top_products ?? dashboard?.top_products ?? [];
  const pareto = buildPareto(topProducts.map((product) => ({ id: product.product_id, name: product.name, amount: product.amount, qty: product.qty })));
  const finance = salesReport ? buildFinancialSnapshot({
    revenue: salesReport.revenue,
    grossProfit: salesReport.gross_profit_estimate,
    observedCashIn: salesReport.revenue,
    inventoryValue: inventory.inventoryValue,
  }) : null;
  const insights = buildKangBisaInsights({
    outOfStockCount: inventory.emptyCount,
    lowStockCount: inventory.lowCount,
    missingCostCount: inventory.missingCostCount,
    revenue: finance?.revenue ?? dashboard?.week_revenue ?? null,
    transactionCount: salesReport?.transaction_count ?? dashboard?.week_count ?? null,
    grossMargin: finance?.grossMargin ?? null,
    classAProductNames: pareto.filter((item) => item.classification === "A").map((item) => item.name),
  });
  const errors = [productError, salesError, dashboardError].filter(Boolean);

  return <div className="flex flex-col gap-5">
    <section className="noise-surface relative min-h-64 overflow-hidden rounded-[24px] p-5 text-on-primary shadow-float sm:p-7">
      <div className="absolute -bottom-14 right-[-2.5rem] w-56 opacity-95 sm:right-3 sm:w-64"><KangBisa alt="Kang Bisa" className="w-full" /></div>
      <div className="relative z-10 max-w-[68%] sm:max-w-xl"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#f0d58f]">Insight berbasis data · Beta</span><h1 className="mt-4 font-accent text-2xl font-bold sm:text-3xl">Tenang, biar Kang Bisa yang bantu membaca angkanya.</h1><p className="mt-3 max-w-md text-sm leading-6 text-white/75">Prioritas usaha disusun dari stok, transaksi, margin, dan produk penggerak omzet milik {tenant.name}.</p></div>
    </section>
    {errors.length > 0 ? <Card className="border-accent/50 bg-accent-soft"><p role="alert" className="text-sm text-warning">Sebagian data belum dapat dibaca: {mapError(errors[0])} Insight yang tersedia tetap ditampilkan.</p></Card> : null}
    <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Fokus hari ini</p><h2 className="mt-1 text-xl font-bold">{insights.length} rekomendasi utama</h2></div><span className="text-xs text-muted">Diperbarui otomatis</span></div><div className="grid gap-3 lg:grid-cols-2">{insights.map((insight) => { const style = priorityStyle[insight.priority]; return <Card key={insight.id} className={`border-l-4 ${style.border}`}><div className="flex items-start justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>{style.label}</span><Icon name="spark" className="h-5 w-5 text-primary" /></div><h3 className="mt-3 text-base font-bold">{insight.title}</h3><p className="mt-1 text-sm leading-6 text-muted">{insight.message}</p><div className="mt-3 rounded-control bg-ivory p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-muted">Dasar rekomendasi</p><p className="mt-1 text-xs font-semibold text-ink">{insight.evidence}</p></div><Link href={insight.href} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-xs font-bold text-white">{insight.actionLabel} →</Link></Card>; })}</div></section>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Card><p className="text-xs text-muted">Stok habis</p><p className="mt-2 text-2xl font-extrabold text-danger">{inventory.emptyCount}</p><p className="mt-1 text-[11px] text-muted">produk aktif</p></Card><Card><p className="text-xs text-muted">Stok menipis</p><p className="mt-2 text-2xl font-extrabold text-warning">{inventory.lowCount}</p><p className="mt-1 text-[11px] text-muted">di bawah minimum</p></Card><Card><p className="text-xs text-muted">Omzet dianalisis</p><p className="mt-2 text-lg font-extrabold text-primary">{formatRupiah(finance?.revenue ?? dashboard?.week_revenue ?? 0)}</p><p className="mt-1 text-[11px] text-muted">{salesReport ? "30 hari terakhir" : dashboard ? "7 hari terakhir" : "menunggu data"}</p></Card><Card><p className="text-xs text-muted">Produk kelas A</p><p className="mt-2 text-2xl font-extrabold text-success">{pareto.filter((item) => item.classification === "A").length}</p><p className="mt-1 text-[11px] text-muted">penggerak omzet</p></Card></section>
    <Card className="bg-primary-soft"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Icon name="spark" className="h-5 w-5" /></span><div><h2 className="font-bold text-primary-deep">Cara Kang Bisa menyusun insight</h2><p className="mt-1 text-sm leading-6 text-muted">Versi ini memakai aturan yang transparan, bukan tebakan: kondisi stok, kelengkapan harga modal, margin kotor, serta kontribusi penjualan. Setiap rekomendasi selalu menyertakan bukti angka agar mudah diperiksa.</p></div></div></Card>
  </div>;
}
