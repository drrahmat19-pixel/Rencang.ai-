"use client";

import { useActionState } from "react";
import { createTenantAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function BuatUsahaForm() {
  const [state, action] = useActionState(createTenantAction, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field id="name" label="Nama usaha" type="text" minLength={2} maxLength={80} placeholder="Contoh: Toko Sumber Rejeki" required />
      <FormMessage error={state?.error} />
      <SubmitButton>Buat usaha</SubmitButton>
    </form>
  );
}
