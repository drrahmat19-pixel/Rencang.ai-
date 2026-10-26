"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { SoonBadge } from "@/components/ui/card";
import { MENU, isActive } from "@/lib/menu";

/** Sidebar kiri, tampil di layar >= 1024 px. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu utama" className="hidden w-60 shrink-0 flex-col gap-1 border-r border-line bg-surface p-3 lg:flex">
      {MENU.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold ${
              active ? "bg-primary text-on-primary" : "text-ink hover:bg-ivory"
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
