"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function MasukForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInAction, undefined);
  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Email" type="email" autoComplete="email" spellCheck={false} required />
      <Field id="password" label="Kata sandi" type="password" autoComplete="current-password" required />
      <FormMessage error={state?.error} info={state?.info} />
      <SubmitButton>Masuk</SubmitButton>
    </form>
  );
}
