"use client";

import { useActionState } from "react";
import { addStockAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function StockInForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(addStockAction.bind(null, productId), undefined);
  return (
    <form action={action} className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
      <Field id={`quantity-${productId}`} name="quantity" label="Jumlah masuk" type="number" min={1} step={1} required />
      <Field id={`note-${productId}`} name="note" label="Catatan" placeholder="Contoh: Belanja pemasok" />
      <SubmitButton variant="secondary">Tambah stok</SubmitButton>
      <div className="sm:col-span-3"><FormMessage error={state?.error} info={state?.info} /></div>
    </form>
  );
}
