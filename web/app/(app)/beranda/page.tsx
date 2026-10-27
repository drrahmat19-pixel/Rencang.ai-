import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { mapError } from "@/lib/errors";
import { formatRupiah } from "@/lib/money";
import { getDashboardReport } from "@/lib/reports";
import { ROLE_LABEL } from "@/lib/roles";
import { requireTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Beranda" };


const quick = [
  { href: "/kasir", label: "Mulai Kasir", icon: "cash" as const },
  { href: "/produk", label: "Kelola Stok", icon: "box" as const },
  { href: "/laporan", label: "Lihat Laporan", icon: "chart" as const },
  { href: "/pengaturan", label: "Kelola Tim", icon: "users" as const },
];

export default async function BerandaPage() {
  const tenant = await requireTenant();
  const { report, error } = await getDashboardReport(tenant.id);
  return <div className="flex flex-col gap-5">
    <section className="overflow-hidden rounded-[20px] bg-primary p-5 text-on-primary shadow-card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#d9c182]">Kang Bisa · Asisten Anda</p><h1 className="mt-2 font-accent text-2xl font-bold">Sampurasun, {tenant.name}!</h1><p className="mt-2 max-w-xl text-sm text-white/80">Pantau usaha, stok, dan penjualan dari satu tempat. Data hari ini otomatis diperbarui dari transaksi kasir.</p></div><div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d4a956] text-xl font-black text-[#093c30] sm:flex">KB</div></div><div className="mt-4 flex flex-wrap gap-2"><Link href="/kasir" className="rounded-full bg-[#d4a956] px-4 py-2 text-sm font-bold text-[#093c30]">Buka Kasir</Link><Link href="/laporan" className="rounded-full border border-white/35 px-4 py-2 text-sm font-semibold">Lihat ringkasan</Link></div></section>
    {error || !report ? <Card><p role="alert" className="text-danger">{mapError(error)}</p></Card> : <>
      <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-bold">Metrik Utama Hari Ini</h2><p className="text-xs text-muted">Masuk sebagai {ROLE_LABEL[tenant.role]}</p></div><span className="text-xs text-muted">WIB</span></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Card><p className="text-xs text-muted">Omzet hari ini</p><p className="mt-2 text-xl font-bold text-primary sm:text-2xl">{formatRupiah(report.today_revenue)}</p><p className="mt-1 text-xs text-muted">Transaksi selesai</p></Card><Card><p className="text-xs text-muted">Transaksi hari ini</p><p className="mt-2 text-xl font-bold text-primary sm:text-2xl">{report.today_count}</p><p className="mt-1 text-xs text-muted">Total struk</p></Card><Card><p className="text-xs text-muted">Omzet 7 hari</p><p className="mt-2 text-xl font-bold text-primary sm:text-2xl">{formatRupiah(report.week_revenue)}</p><p className="mt-1 text-xs text-muted">{report.week_count} transaksi</p></Card><Card><p className="text-xs text-muted">Stok perlu dicek</p><p className="mt-2 text-xl font-bold text-warning sm:text-2xl">{report.low_stock.length}</p><p className="mt-1 text-xs text-muted">Menipis atau habis</p></Card></div></section>
      {report.low_stock.length > 0 ? <Link href="/produk" className="flex items-center gap-3 rounded-card border border-[#ead28f] bg-[#fff9e8] p-4 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4a956]/20 font-bold text-warning">!</span><span className="flex-1"><strong>Perhatian stok menipis</strong><br /><span className="text-muted">{report.low_stock.slice(0, 3).map((item) => item.name).join(", ")}{report.low_stock.length > 3 ? ` dan ${report.low_stock.length - 3} lainnya` : ""}.</span></span><span className="font-semibold text-primary">Cek →</span></Link> : null}
      <section><h2 className="mb-3 text-lg font-bold">Pintasan Cepat</h2><div className="grid grid-cols-4 gap-2">{quick.map((item) => <Link key={item.href} href={item.href} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface p-2 text-center text-xs font-semibold shadow-card transition hover:-translate-y-0.5 hover:border-primary"><span className="rounded-control bg-[#e9f3ed] p-2 text-primary"><Icon name={item.icon} /></span>{item.label}</Link>)}</div></section>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Produk Terlaris 7 Hari</h2><Link href="/laporan" className="text-sm font-semibold text-primary">Lihat semua →</Link></div><Card className="divide-y divide-line !p-0">{report.top_products.length === 0 ? <p className="p-4 text-sm text-muted">Belum ada transaksi dalam 7 hari terakhir.</p> : report.top_products.map((product, index) => <div key={product.product_id} className="flex items-center gap-3 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-control bg-ivory font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-xs text-muted">{product.qty} terjual</p></div><p className="text-sm font-bold text-primary">{formatRupiah(product.amount)}</p></div>)}</Card></section>
    </>}
    <section className="grid gap-3 sm:grid-cols-2"><Card className="border-dashed"><div className="flex items-center gap-3"><Icon name="chat" className="h-7 w-7 text-primary" /><div><p className="font-semibold">Pesan pelanggan</p><p className="text-sm text-muted">Segera hadir setelah inti operasional stabil.</p></div></div></Card><Card className="border-dashed"><div className="flex items-center gap-3"><Icon name="spark" className="h-7 w-7 text-primary" /><div><p className="font-semibold">Kang Bisa AI</p><p className="text-sm text-muted">Asisten cerdas sedang disiapkan.</p></div></div></Card></section>
  </div>;
}
