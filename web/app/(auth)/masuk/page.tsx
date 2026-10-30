import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/paths";
import { MasukForm } from "./masuk-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="section-kicker">Selamat datang kembali</p>
      <h1 className="mt-3 font-accent text-3xl font-bold text-primary-deep">Masuk ke usaha Anda</h1>
      <MasukForm next={safeNext(next)} />
      <p className="mt-4 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-bold text-primary underline decoration-accent underline-offset-4">
          Daftar
        </Link>
      </p>
      <Link href="/demo" className="mt-4 flex min-h-12 items-center justify-center rounded-control border border-line bg-primary-soft text-sm font-bold text-primary transition-colors hover:border-primary/30">
        Lihat demo tanpa database
      </Link>
      <Link href="/panduan" className="mt-3 block min-h-11 text-center text-sm font-semibold leading-11 text-muted underline decoration-line underline-offset-4 hover:text-primary">
        Baca panduan penggunaan
      </Link>
    </>
  );
}
