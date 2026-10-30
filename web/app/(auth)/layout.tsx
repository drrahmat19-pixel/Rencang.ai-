import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { KangBisa } from "@/components/brand/kang-bisa";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="brand-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute -left-32 top-1/4 -z-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white bg-surface shadow-float lg:grid-cols-[.9fr_1.1fr]">
        <section className="noise-surface relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col">
          <div className="relative z-10 inline-flex self-start rounded-[14px] bg-ivory px-3 py-2"><BrandLogo priority className="w-[160px]" /></div>
          <div className="relative z-10 mt-12"><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f0d58f]">Sobat digital usaha</p><h2 className="mt-4 text-balance font-accent text-4xl font-bold leading-tight">Rencang usaha, biar Kang Bisa yang bantu.</h2><p className="mt-4 max-w-xs text-sm leading-7 text-white/65">Satu tempat untuk kasir, stok, laporan, dan tim usaha Anda.</p></div>
          <KangBisa className="absolute -bottom-16 -right-20 w-[340px] opacity-80" alt="" />
          <p className="relative z-10 mt-auto max-w-[190px] text-xs text-white/45">Dibangun untuk alur kerja UMKM Indonesia.</p>
        </section>
        <section className="p-5 sm:p-10 lg:p-12">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto inline-flex rounded-[14px] bg-ivory px-3 py-2 lg:hidden"><BrandLogo priority className="w-[154px]" /></div>
            <p className="mt-1 text-sm text-muted">Masuk dan lanjutkan operasional usaha Anda.</p>
          </div>
          <Card className="border-0 !p-0 shadow-none">{children}</Card>
        </section>
      </div>
    </main>
  );
}
