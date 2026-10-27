import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/actions";
import { BottomBar } from "@/components/shell/bottom-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { Button } from "@/components/ui/button";
import { requireTenant } from "@/lib/tenant";

/** Shell dashboard: wajib login + tenant aktif yang valid (diverifikasi server). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const tenant = await requireTenant();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-accent text-lg font-bold text-on-primary">R</div>
          <div className="min-w-0"><p className="truncate text-sm font-bold leading-tight text-primary">{tenant.name}</p><p className="truncate text-xs text-muted">Rencang AI · {tenant.role === "owner" ? "Pemilik" : tenant.role}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pilih-usaha" className="hidden text-sm font-semibold text-primary underline sm:inline">
            Ganti usaha
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary" className="!min-h-9 !px-3">
              Keluar
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar role={tenant.role} />
        <main className="min-w-0 flex-1 p-4 pb-24 lg:p-6 lg:pb-6"><div className="mx-auto w-full max-w-6xl">{children}</div></main>
      </div>
      <BottomBar role={tenant.role} />
    </div>
  );
}
