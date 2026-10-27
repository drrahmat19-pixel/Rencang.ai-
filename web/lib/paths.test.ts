import { describe, expect, it } from "vitest";
import { isAuthPath, isPublicPath, safeNext } from "./paths";

describe("paths", () => {
  it("rute publik mencakup autentikasi dan demo", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/masuk")).toBe(true);
    expect(isPublicPath("/daftar")).toBe(true);
    expect(isPublicPath("/demo")).toBe(true);
    expect(isPublicPath("/panduan")).toBe(true);
    expect(isPublicPath("/offline")).toBe(true);
    expect(isPublicPath("/manifest.webmanifest")).toBe(true);
    expect(isPublicPath("/sw.js")).toBe(true);
    expect(isPublicPath("/beranda")).toBe(false);
    expect(isPublicPath("/masukkan")).toBe(false);
  });
  it("hanya rute autentikasi yang dialihkan setelah login", () => {
    expect(isAuthPath("/masuk")).toBe(true);
    expect(isAuthPath("/daftar")).toBe(true);
    expect(isAuthPath("/demo")).toBe(false);
  });
  it("safeNext menolak redirect keluar situs", () => {
    expect(safeNext("/kasir")).toBe("/kasir");
    expect(safeNext("//evil.com")).toBe("/beranda");
    expect(safeNext("https://evil.com")).toBe("/beranda");
    expect(safeNext(null)).toBe("/beranda");
  });
});
