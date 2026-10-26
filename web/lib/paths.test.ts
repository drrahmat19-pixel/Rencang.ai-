import { describe, expect, it } from "vitest";
import { isPublicPath, safeNext } from "./paths";

describe("paths", () => {
  it("rute publik hanya masuk & daftar", () => {
    expect(isPublicPath("/masuk")).toBe(true);
    expect(isPublicPath("/daftar")).toBe(true);
    expect(isPublicPath("/beranda")).toBe(false);
    expect(isPublicPath("/masukkan")).toBe(false);
  });
  it("safeNext menolak redirect keluar situs", () => {
    expect(safeNext("/kasir")).toBe("/kasir");
    expect(safeNext("//evil.com")).toBe("/beranda");
    expect(safeNext("https://evil.com")).toBe("/beranda");
    expect(safeNext(null)).toBe("/beranda");
  });
});
