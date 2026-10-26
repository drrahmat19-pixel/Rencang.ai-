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
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
        <div className="min-w-0">
          <p className="font-accent text-xl font-bold leading-tight text-primary">Rencang AI</p>
          <p className="truncate text-sm text-muted">{tenant.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pilih-usaha" className="hidden text-sm font-semibold text-primary underline sm:inline">
            Ganti usaha
          </Link>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Keluar
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 pb-24 lg:p-6 lg:pb-6">{children}</main>
      </div>
      <BottomBar />
    </div>
  );
}
