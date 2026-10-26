import type { Metadata } from "next";
import Link from "next/link";
import { DaftarForm } from "./daftar-form";

export const metadata: Metadata = { title: "Daftar" };

export default function DaftarPage() {
  return (
    <>
      <h1 className="font-accent text-2xl font-bold">Daftar</h1>
      <p className="mt-1 text-sm text-muted">Buat akun, lalu daftarkan usaha Anda.</p>
      <DaftarForm />
      <p className="mt-4 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-primary underline">
          Masuk
        </Link>
      </p>
    </>
  );
}
