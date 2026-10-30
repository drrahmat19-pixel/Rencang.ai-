import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-line/90 bg-surface p-4 shadow-card ${className}`}>{children}</div>
  );
}

/** Kartu ringkasan: angka besar + label + tautan "Lihat detail". */
export function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
      {href ? (
        <Link href={href} className="mt-2 inline-block text-sm font-semibold text-primary underline">
          Lihat detail
        </Link>
      ) : null}
    </Card>
  );
}

export function SoonBadge() {
  return (
    <span className="rounded-full border border-accent/60 bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
      Segera
    </span>
  );
}
