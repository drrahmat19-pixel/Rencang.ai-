"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return <Card className="mx-auto max-w-xl text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff0e8] text-xl font-bold text-danger" aria-hidden="true">!</span><h1 className="mt-4 font-accent text-2xl font-bold">Halaman belum dapat dimuat</h1><p className="mt-2 text-sm leading-6 text-muted">Periksa koneksi lalu coba lagi. Data yang sudah tersimpan tidak berubah.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button type="button" onClick={() => retry()}>Coba lagi</Button><Link href="/beranda" className="inline-flex min-h-11 items-center rounded-control border border-primary px-4 text-sm font-bold text-primary">Kembali ke Beranda</Link></div></Card>;
}
