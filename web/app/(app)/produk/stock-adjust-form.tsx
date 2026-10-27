"use client";

import { useActionState } from "react";
import { adjustStockAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function StockAdjustForm({ productId, allowPositive }: { productId: string; allowPositive: boolean }) {
  const [state, action] = useActionState(adjustStockAction.bind(null, productId), undefined);
  return (
    <details className="mt-3 border-t border-line pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary">Koreksi stok fisik</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field
          id={`adjustment-${productId}`}
          name="quantity"
          label="Perubahan jumlah"
          type="number"
          step={1}
          placeholder="Contoh: -2"
          hint={allowPositive ? "Gunakan minus untuk berkurang, plus untuk bertambah." : "Gunakan angka minus untuk barang rusak atau hilang."}
          required
        />
        <Field id={`reason-${productId}`} name="reason" label="Alasan wajib" placeholder="Contoh: 2 botol pecah" required />
        <SubmitButton variant="secondary">Simpan koreksi</SubmitButton>
        <div className="sm:col-span-3"><FormMessage error={state?.error} info={state?.info} /></div>
      </form>
    </details>
  );
}
