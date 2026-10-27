import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-ivory p-4"><div className="w-full max-w-md text-center"><p className="font-accent text-7xl font-bold text-primary">404</p><h1 className="mt-3 font-accent text-2xl font-bold">Halaman tidak ditemukan</h1><p className="mt-3 text-sm leading-6 text-muted">Alamat mungkin salah atau halaman sudah dipindahkan.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/" className="inline-flex min-h-11 items-center rounded-control bg-primary px-4 text-sm font-bold text-white">Halaman Utama</Link><Link href="/demo" className="inline-flex min-h-11 items-center rounded-control border border-primary px-4 text-sm font-bold text-primary">Buka Demo</Link></div></div></main>;
}
