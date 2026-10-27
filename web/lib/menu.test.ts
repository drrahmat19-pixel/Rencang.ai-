import { describe, expect, it } from "vitest";
import { BOTTOM_MAIN, BOTTOM_MORE, MENU, isActive } from "./menu";

describe("menu", () => {
  it("ada 8 menu; Pelanggan/Pesan/Kang Bisa bertanda segera", () => {
    expect(MENU).toHaveLength(8);
    expect(MENU.filter((m) => m.soon).map((m) => m.label)).toEqual(["Pelanggan", "Pesan", "Kang Bisa"]);
  });
  it("bottom bar: 5 menu utama sesuai mockup", () => {
    expect(BOTTOM_MAIN).toHaveLength(5);
    expect(BOTTOM_MAIN.map((m) => m.label)).toEqual(["Beranda", "Kasir", "Produk & Stok", "Pelanggan", "Pengaturan"]);
    expect(BOTTOM_MORE.map((m) => m.label)).toEqual(["Pesan", "Laporan", "Kang Bisa"]);
  });
  it("isActive cocok untuk subrute saja", () => {
    expect(isActive("/produk/123", "/produk")).toBe(true);
    expect(isActive("/produkku", "/produk")).toBe(false);
  });
});
