export type IconName =
  | "home" | "cash" | "box" | "users" | "chat" | "chart" | "spark" | "gear" | "more";

export type MenuItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Menu belum aktif (ditandai "Segera"). */
  soon?: boolean;
};

/** 8 menu dashboard (urutan = urutan sidebar). */
export const MENU: MenuItem[] = [
  { href: "/beranda", label: "Beranda", icon: "home" },
  { href: "/kasir", label: "Kasir", icon: "cash" },
  { href: "/produk", label: "Produk & Stok", icon: "box" },
  { href: "/pelanggan", label: "Pelanggan", icon: "users", soon: true },
  { href: "/pesan", label: "Pesan", icon: "chat", soon: true },
  { href: "/laporan", label: "Laporan", icon: "chart" },
  { href: "/kang-bisa", label: "Kang Bisa", icon: "spark", soon: true },
  { href: "/pengaturan", label: "Pengaturan", icon: "gear" },
];

/** Bottom bar HP mengikuti mockup: Beranda, Kasir, Stok, Pelanggan, Akun. */
const MAIN_HREFS = ["/beranda", "/kasir", "/produk", "/pelanggan", "/pengaturan"];
export const BOTTOM_MAIN = MAIN_HREFS.map((h) => MENU.find((m) => m.href === h)!);
export const BOTTOM_MORE = MENU.filter((m) => !MAIN_HREFS.includes(m.href));

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
