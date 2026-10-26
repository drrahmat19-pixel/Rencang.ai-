import type { InputHTMLAttributes } from "react";

/** Form: label di atas, pesan error di bawah field. */
export function Field({
  label,
  id,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string; hint?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
        className="min-h-11 w-full rounded-control border border-line bg-surface px-3 text-base text-ink placeholder:text-muted"
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-control border border-danger bg-surface px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  if (info)
    return (
      <p role="status" className="rounded-control border border-success bg-surface px-3 py-2 text-sm text-success">
        {info}
      </p>
    );
  return null;
}
