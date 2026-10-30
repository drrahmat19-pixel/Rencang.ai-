"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "border border-primary bg-primary text-on-primary shadow-[0_8px_24px_rgb(11_79_60/0.18)] hover:bg-primary-hover hover:shadow-[0_10px_28px_rgb(11_79_60/0.24)] active:bg-primary-deep",
  secondary: "border border-line bg-surface text-primary shadow-sm hover:border-primary/40 hover:bg-primary-soft",
  danger: "border border-danger bg-danger text-on-primary hover:opacity-90",
};

export function buttonClass(variant: Variant = "primary", extra = "") {
  return `inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-bold transition-[background-color,border-color,box-shadow,color] duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={buttonClass(variant, className)} />;
}

/** Tombol kirim form: otomatis nonaktif + teks "Memproses…" saat form berjalan. */
export function SubmitButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, className)}>
      {pending ? "Memproses…" : children}
    </button>
  );
}
