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
    <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface lg:hidden">
      <div className="flex">
        {mainItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${ITEM} ${active ? "text-primary" : "text-muted"}`}
            >
              <Icon name={item.icon} />
              <span className="max-w-full truncate">{item.href === "/produk" ? "Stok" : item.href === "/pengaturan" ? "Akun" : item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
