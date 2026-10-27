"use client";

import { Button } from "@/components/ui/button";

function printReceipt(width: "58" | "80") {
  const receipt = document.querySelector<HTMLElement>(".receipt-print");
  if (!receipt) return;
  receipt.classList.toggle("receipt-print-58", width === "58");
  receipt.classList.toggle("receipt-print-80", width === "80");
  window.print();
}

export function PrintButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => printReceipt("58")}>Cetak 58 mm</Button>
      <Button type="button" variant="secondary" onClick={() => printReceipt("80")}>Cetak 80 mm / PDF</Button>
    </div>
  );
}

