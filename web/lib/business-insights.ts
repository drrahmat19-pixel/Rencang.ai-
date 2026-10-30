export type ParetoInput = { id: string; name: string; amount: number; qty?: number };
export type ParetoItem = ParetoInput & {
  share: number;
  cumulativeShare: number;
  classification: "A" | "B" | "C";
};

export function buildPareto(items: ParetoInput[]): ParetoItem[] {
  const sorted = [...items].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  const total = sorted.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  let cumulative = 0;

  return sorted.map((item) => {
    const previous = cumulative;
    const share = total > 0 ? Math.max(0, item.amount) / total : 0;
    cumulative += share;
    const classification = previous < 0.8 ? "A" : previous < 0.95 ? "B" : "C";
    return { ...item, share, cumulativeShare: cumulative, classification };
  });
}

export type InventoryInput = {
  stock_balance: number;
  min_stock: number;
  cost: number | null;
  price: number;
  track_stock: boolean;
  is_active: boolean;
};

export function summarizeInventory(products: InventoryInput[]) {
  return products.reduce(
    (summary, product) => {
      if (!product.is_active || !product.track_stock) return summary;
      const balance = Math.max(0, product.stock_balance);
      summary.inventoryValue += balance * Math.max(0, product.cost ?? 0);
      summary.potentialSalesValue += balance * Math.max(0, product.price);
      if (balance === 0) summary.emptyCount += 1;
      else if (balance <= product.min_stock) summary.lowCount += 1;
      if (product.cost === null) summary.missingCostCount += 1;
      return summary;
    },
    { inventoryValue: 0, potentialSalesValue: 0, lowCount: 0, emptyCount: 0, missingCostCount: 0 },
  );
}

export function buildFinancialSnapshot(input: {
  revenue: number;
  grossProfit: number;
  operatingExpenses?: number | null;
  observedCashIn: number;
  inventoryValue: number;
  fixedAssets?: number;
  liabilities?: number | null;
}) {
  const revenue = Math.max(0, input.revenue);
  const grossProfit = Math.max(0, input.grossProfit);
  const costOfGoods = Math.max(0, revenue - grossProfit);
  const expenses = input.operatingExpenses ?? null;
  const totalAssets = Math.max(0, input.observedCashIn) + Math.max(0, input.inventoryValue) + Math.max(0, input.fixedAssets ?? 0);
  const liabilities = input.liabilities ?? null;

  return {
    revenue,
    costOfGoods,
    grossProfit,
    grossMargin: revenue > 0 ? grossProfit / revenue : 0,
    operatingExpenses: expenses,
    netProfitEstimate: expenses === null ? null : grossProfit - Math.max(0, expenses),
    observedCashIn: Math.max(0, input.observedCashIn),
    inventoryValue: Math.max(0, input.inventoryValue),
    fixedAssets: Math.max(0, input.fixedAssets ?? 0),
    totalAssets,
    liabilities,
    equityEstimate: liabilities === null ? null : totalAssets - Math.max(0, liabilities),
  };
}
