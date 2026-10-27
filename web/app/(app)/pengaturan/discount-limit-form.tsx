"use client";

import { useActionState } from "react";
import { updateCashierDiscountAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function DiscountLimitForm({ currentLimit }: { currentLimit: number }) {
  const [state, action] = useActionState(updateCashierDiscountAction, undefined);
  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto] sm:items-end">
      <Field
        id="cashier_discount_limit"
        label="Batas diskon kasir"
        type="number"
        min={0}
        max={1_000_000_000}
        step={1}
        defaultValue={currentLimit}
        hint="Nominal Rupiah maksimum per transaksi. Isi 0 untuk menonaktifkan diskon kasir."
        required
      />
      <SubmitButton>Simpan batas</SubmitButton>
      <div className="sm:col-span-2"><FormMessage error={state?.error} info={state?.info} /></div>
    </form>
  );
}

