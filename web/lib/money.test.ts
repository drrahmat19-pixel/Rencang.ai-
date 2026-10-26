import { describe, expect, it } from "vitest";
import { formatRupiah } from "./money";

describe("formatRupiah", () => {
  it("memakai titik sebagai pemisah ribuan", () => {
    expect(formatRupiah(1850000)).toBe("Rp1.850.000");
    expect(formatRupiah(500)).toBe("Rp500");
    expect(formatRupiah(1000)).toBe("Rp1.000");
    expect(formatRupiah(1234567890)).toBe("Rp1.234.567.890");
  });
  it("nol dan negatif", () => {
    expect(formatRupiah(0)).toBe("Rp0");
    expect(formatRupiah(-25000)).toBe("-Rp25.000");
  });
  it("nilai tidak valid jatuh ke Rp0", () => {
    expect(formatRupiah(NaN)).toBe("Rp0");
  });
});
