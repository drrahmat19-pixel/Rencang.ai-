"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { SoonBadge } from "@/components/ui/card";
import { MENU, isActive } from "@/lib/menu";
import type { Role } from "@/lib/tenant";

/** Sidebar kiri, tampil di layar >= 1024 px. */
export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = role === "staf_stok" ? MENU.filter((item) => item.href !== "/kasir") : MENU;
  return (
    <nav aria-label="Menu utama" className="hidden w-64 shrink-0 flex-col gap-1.5 border-r border-line/80 bg-surface/75 p-4 backdrop-blur lg:flex">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-[background-color,color,box-shadow] ${
              active ? "bg-primary text-on-primary shadow-[0_8px_20px_rgb(11_79_60/0.16)]" : "text-muted hover:bg-primary-soft hover:text-primary"
            }`}
          >
            <Icon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.soon ? <SoonBadge /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
