"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { BOTTOM_MAIN, isActive } from "@/lib/menu";
import type { Role } from "@/lib/tenant";

const ITEM = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold";

/** Bottom bar HP (< 1024 px): lima tujuan utama sesuai mockup. */
export function BottomBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const mainItems = role === "staf_stok" ? BOTTOM_MAIN.filter((item) => item.href !== "/kasir") : BOTTOM_MAIN;

  return (
    <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 border-t border-line/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgb(6_47_37/0.06)] backdrop-blur-xl lg:hidden">
      <div className="flex">
        {mainItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${ITEM} relative transition-colors ${active ? "text-primary" : "text-muted"}`}
            >
              {active ? <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" /> : null}
              <span className={active ? "rounded-full bg-primary-soft px-3 py-1" : "px-3 py-1"}><Icon name={item.icon} /></span>
              <span className="max-w-full truncate">{item.href === "/produk" ? "Stok" : item.href === "/pengaturan" ? "Akun" : item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
