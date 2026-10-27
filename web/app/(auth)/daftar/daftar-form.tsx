"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function DaftarForm() {
  const [state, action] = useActionState(signUpAction, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field id="email" label="Email" type="email" autoComplete="email" spellCheck={false} required />
      <Field
        id="password"
        label="Kata sandi"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="Minimal 8 karakter."
        required
      />
      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton>Daftar</SubmitButton>
    </form>
  );
}
