import { describe, expect, it } from "vitest";
import { FALLBACK_ERROR, mapError } from "./errors";

describe("mapError", () => {
  it("memetakan kode RPC dari objek error Supabase", () => {
    expect(mapError({ message: "INVALID_NAME" })).toBe("Nama usaha harus 2 sampai 80 huruf.");
    expect(mapError({ message: "FORBIDDEN" })).toContain("izin");
  });
  it("menemukan kode di dalam pesan yang lebih panjang", () => {
    expect(mapError(new Error("P0001: UNAUTHENTICATED"))).toContain("masuk lagi");
  });
  it("memetakan pesan Auth umum", () => {
    expect(mapError({ message: "Invalid login credentials" })).toBe("Email atau kata sandi salah.");
  });
  it("kode tak dikenal dan nilai aneh jatuh ke pesan bawaan", () => {
    expect(mapError({ message: "boom" })).toBe(FALLBACK_ERROR);
    expect(mapError(null)).toBe(FALLBACK_ERROR);
    expect(mapError(42)).toBe(FALLBACK_ERROR);
  });
});
