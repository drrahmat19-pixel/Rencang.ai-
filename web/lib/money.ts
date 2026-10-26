/** Format bilangan bulat Rupiah: 1850000 -> "Rp1.850.000". Negatif: "-Rp1.000". */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount)) return "Rp0";
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${rounded < 0 ? "-" : ""}Rp${digits}`;
}
