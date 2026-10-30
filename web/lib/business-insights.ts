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

export type KangBisaPriority = "urgent" | "attention" | "opportunity" | "positive";

export type KangBisaInsight = {
  id: string;
  priority: KangBisaPriority;
  title: string;
  message: string;
  evidence: string;
  actionLabel: string;
  href: string;
};

export function buildKangBisaInsights(input: {
  outOfStockCount?: number;
  lowStockCount?: number;
  missingCostCount?: number;
  revenue?: number | null;
  transactionCount?: number | null;
  grossMargin?: number | null;
  classAProductNames?: string[];
  customerAtRiskCount?: number;
}): KangBisaInsight[] {
  const insights: KangBisaInsight[] = [];
  const outOfStockCount = Math.max(0, input.outOfStockCount ?? 0);
  const lowStockCount = Math.max(0, input.lowStockCount ?? 0);
  const missingCostCount = Math.max(0, input.missingCostCount ?? 0);
  const customerAtRiskCount = Math.max(0, input.customerAtRiskCount ?? 0);
  const classAProductNames = (input.classAProductNames ?? []).filter(Boolean).slice(0, 3);

  if (outOfStockCount > 0) {
    insights.push({
      id: "restock-empty",
      priority: "urgent",
      title: "Pulihkan stok yang sudah habis",
      message: "Produk yang kosong berisiko langsung kehilangan penjualan. Dahulukan produk dengan permintaan tertinggi.",
      evidence: `${outOfStockCount} produk aktif tercatat habis`,
      actionLabel: "Cek stok habis",
      href: "/produk?status=empty",
    });
  }

  if (lowStockCount > 0) {
    insights.push({
      id: "restock-low",
      priority: "attention",
      title: "Siapkan isi ulang sebelum kehabisan",
      message: "Periksa kecepatan penjualan dan waktu tunggu pemasok sebelum menentukan jumlah belanja.",
      evidence: `${lowStockCount} produk berada di bawah batas minimum`,
      actionLabel: "Tinjau stok menipis",
      href: "/produk?status=low",
    });
  }

  if (missingCostCount > 0) {
    insights.push({
      id: "complete-cost",
      priority: "attention",
      title: "Lengkapi harga modal produk",
      message: "Harga modal diperlukan agar margin dan laba kotor tidak menyesatkan saat mengambil keputusan.",
      evidence: `${missingCostCount} produk belum memiliki harga modal`,
      actionLabel: "Lengkapi produk",
      href: "/produk",
    });
  }

  if ((input.revenue ?? 0) > 0 && input.grossMargin !== null && input.grossMargin !== undefined && input.grossMargin < 0.25) {
    insights.push({
      id: "protect-margin",
      priority: "attention",
      title: "Margin kotor perlu dilindungi",
      message: "Tinjau harga jual, diskon, dan biaya bahan pada produk penyumbang omzet terbesar.",
      evidence: `Margin kotor saat ini ${new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 1 }).format(Math.max(0, input.grossMargin))}`,
      actionLabel: "Buka laporan keuangan",
      href: "/laporan",
    });
  }

  if (classAProductNames.length > 0) {
    insights.push({
      id: "protect-best-sellers",
      priority: "opportunity",
      title: "Jaga mesin utama omzet",
      message: "Pastikan produk kelas A selalu tersedia dan tampil menonjol saat pelanggan memesan.",
      evidence: `${classAProductNames.join(", ")} termasuk penggerak utama omzet`,
      actionLabel: "Lihat Pareto produk",
      href: "/laporan#pareto-produk",
    });
  }

  if (customerAtRiskCount > 0) {
    insights.push({
      id: "reactivate-customers",
      priority: "opportunity",
      title: "Rangkul pelanggan yang mulai tidak aktif",
      message: "Mulai dari pelanggan bernilai tinggi dengan sapaan personal atau penawaran yang relevan.",
      evidence: `${customerAtRiskCount} pelanggan membutuhkan tindak lanjut`,
      actionLabel: "Lihat pelanggan",
      href: "/pelanggan",
    });
  }

  if (input.transactionCount === 0) {
    insights.push({
      id: "start-recording-sales",
      priority: "opportunity",
      title: "Mulai bentuk pola penjualan",
      message: "Catat transaksi melalui kasir agar rekomendasi produk dan keuangan semakin akurat.",
      evidence: "Belum ada transaksi pada periode analisis",
      actionLabel: "Buka kasir",
      href: "/kasir",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "operations-healthy",
      priority: "positive",
      title: "Operasional utama terkendali",
      message: "Tidak ada risiko penting yang terdeteksi dari data saat ini. Pertahankan pencatatan rutin agar kondisi tetap terpantau.",
      evidence: "Stok, harga modal, dan margin tidak memicu peringatan",
      actionLabel: "Lihat laporan lengkap",
      href: "/laporan",
    });
  }

  return insights;
}
