import { describe, expect, it } from "vitest";
import { buildFinancialSnapshot, buildPareto, summarizeInventory } from "@/lib/business-insights";

describe("business insights", () => {
  it("membangun Pareto berdasarkan kontribusi omzet", () => {
    const rows = buildPareto([
      { id: "b", name: "B", amount: 200 },
      { id: "a", name: "A", amount: 600 },
      { id: "c", name: "C", amount: 150 },
      { id: "d", name: "D", amount: 50 },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["a", "b", "c", "d"]);
    expect(rows[0].share).toBeCloseTo(0.6);
    expect(rows[1].cumulativeShare).toBeCloseTo(0.8);
    expect(rows.map((row) => row.classification)).toEqual(["A", "A", "B", "C"]);
  });

  it("meringkas nilai dan risiko persediaan", () => {
    const summary = summarizeInventory([
      { stock_balance: 10, min_stock: 3, cost: 5000, price: 10000, track_stock: true, is_active: true },
      { stock_balance: 2, min_stock: 3, cost: null, price: 12000, track_stock: true, is_active: true },
      { stock_balance: 0, min_stock: 1, cost: 2000, price: 4000, track_stock: true, is_active: true },
      { stock_balance: 99, min_stock: 1, cost: 1, price: 2, track_stock: false, is_active: true },
    ]);
    expect(summary).toEqual({ inventoryValue: 50000, potentialSalesValue: 124000, lowCount: 1, emptyCount: 1, missingCostCount: 1 });
  });

  it("tidak menyebut laba bersih ketika biaya belum dicatat", () => {
    const snapshot = buildFinancialSnapshot({ revenue: 1_000_000, grossProfit: 400_000, observedCashIn: 1_000_000, inventoryValue: 250_000 });
    expect(snapshot.costOfGoods).toBe(600_000);
    expect(snapshot.grossMargin).toBeCloseTo(0.4);
    expect(snapshot.netProfitEstimate).toBeNull();
    expect(snapshot.totalAssets).toBe(1_250_000);
    expect(snapshot.equityEstimate).toBeNull();
  });
});
