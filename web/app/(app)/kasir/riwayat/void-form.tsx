"use client";

import { useActionState } from "react";
import { requestVoidAction, voidSaleAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function VoidForm({ saleId, mode }: { saleId: string; mode: "request" | "void" }) {
  const serverAction = mode === "request" ? requestVoidAction : voidSaleAction;
  const [state, action] = useActionState(serverAction.bind(null, saleId), undefined);
  return (
    <details className="mt-3 border-t border-line pt-3">
      <summary className={`cursor-pointer text-sm font-semibold ${mode === "void" ? "text-danger" : "text-primary"}`}>
        {mode === "void" ? "Batalkan transaksi" : "Ajukan pembatalan"}
      </summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          id={`reason-${mode}-${saleId}`}
          name="reason"
          label="Alasan pembatalan"
          minLength={3}
          maxLength={240}
          placeholder="Contoh: Pembeli salah memilih produk"
          required
        />
        <SubmitButton variant={mode === "void" ? "danger" : "secondary"}>
          {mode === "void" ? "Konfirmasi batal" : "Kirim pengajuan"}
        </SubmitButton>
        <div className="sm:col-span-2"><FormMessage error={state?.error} info={state?.info} /></div>
      </form>
    </details>
  );
}

