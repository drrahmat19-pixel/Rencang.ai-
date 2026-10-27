"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { SoonBadge } from "@/components/ui/card";
import { BOTTOM_MAIN, BOTTOM_MORE, isActive } from "@/lib/menu";
import type { Role } from "@/lib/tenant";

const ITEM = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold";

/** Bottom bar HP (< 1024 px): 5 menu utama + "Lainnya". */
export function BottomBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const mainItems = role === "staf_stok" ? BOTTOM_MAIN.filter((item) => item.href !== "/kasir") : BOTTOM_MAIN;
  const moreItems = role === "staf_stok" ? BOTTOM_MORE.filter((item) => item.href !== "/kasir") : BOTTOM_MORE;
  const moreActive = moreItems.some((m) => isActive(pathname, m.href));

  return (
    <nav aria-label="Menu utama" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface lg:hidden">
      {open ? (
        <ul id="menu-lainnya" className="flex flex-col gap-1 border-b border-line p-2">
          {moreItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className="flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold hover:bg-ivory"
              >
                <Icon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {item.soon ? <SoonBadge /> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex">
        {mainItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`${ITEM} ${active ? "text-primary" : "text-muted"}`}
            >
              <Icon name={item.icon} />
              <span className="max-w-full truncate">{item.label === "Produk & Stok" ? "Produk" : item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="menu-lainnya"
          onClick={() => setOpen((v) => !v)}
          className={`${ITEM} ${moreActive || open ? "text-primary" : "text-muted"}`}
        >
          <Icon name="more" />
          <span>Lainnya</span>
        </button>
      </div>
    </nav>
  );
}
