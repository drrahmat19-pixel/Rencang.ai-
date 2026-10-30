import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="brand-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white bg-surface shadow-float lg:grid-cols-[.9fr_1.1fr]">
        <section className="noise-surface hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-white/20 bg-white/10 font-accent text-xl font-bold">R</span><span className="font-accent text-xl font-bold">Rencang AI</span></div>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f0d58f]">Sobat digital usaha</p><h2 className="mt-4 text-balance font-accent text-4xl font-bold leading-tight">Kerja lebih rapi. Keputusan lebih tenang.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-white/65">Satu tempat untuk kasir, stok, laporan, dan tim usaha Anda.</p></div>
          <p className="text-xs text-white/45">Dibangun untuk alur kerja UMKM Indonesia.</p>
        </section>
        <section className="p-5 sm:p-10 lg:p-12">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary font-accent text-xl font-bold text-white shadow-card lg:mx-0 lg:hidden">R</div>
            <p className="mt-3 font-accent text-2xl font-bold text-primary lg:hidden">Rencang AI</p>
            <p className="mt-1 text-sm text-muted">Masuk dan lanjutkan operasional usaha Anda.</p>
          </div>
          <Card className="border-0 !p-0 shadow-none">{children}</Card>
        </section>
      </div>
    </main>
  );
}
