import type { Metadata } from "next";
import Link from "next/link";
import { safeNext } from "@/lib/paths";
import { MasukForm } from "./masuk-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="font-accent text-2xl font-bold">Masuk</h1>
      <MasukForm next={safeNext(next)} />
      <p className="mt-4 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-primary underline">
          Daftar
        </Link>
      </p>
      <Link href="/demo" className="mt-3 flex min-h-11 items-center justify-center rounded-control border border-primary text-sm font-semibold text-primary">
        Lihat demo tanpa database
      </Link>
      <Link href="/panduan" className="mt-2 block text-center text-sm font-semibold text-primary underline">
        Baca panduan penggunaan
      </Link>
    </>
  );
}
