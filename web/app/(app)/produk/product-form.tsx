"use client";

import { useActionState, useEffect, useRef } from "react";
import { createProductAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function ProductForm() {
  const [state, action] = useActionState(createProductAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.info) formRef.current?.reset();
  }, [state?.info]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <Field id="sku" label="SKU" autoComplete="off" placeholder="CONTOH-001…" maxLength={40} required />
      <Field id="name" label="Nama produk" autoComplete="off" placeholder="Contoh: Kopi Susu…" maxLength={120} required />
      <Field id="category" label="Kategori" autoComplete="off" placeholder="Minuman…" maxLength={80} />
      <Field id="unit" label="Satuan" autoComplete="off" placeholder="pcs…" defaultValue="pcs" maxLength={20} required />
      <div className="flex flex-col gap-1">
        <label htmlFor="product_type" className="text-sm font-semibold text-ink">Jenis produk</label>
        <select id="product_type" name="product_type" className="min-h-11 rounded-control border border-line bg-surface px-3">
          <option value="goods">Barang — stok dikelola</option>
          <option value="service">Jasa — tanpa stok</option>
        </select>
      </div>
      <Field id="price" label="Harga jual" type="number" min={0} step={1} defaultValue={0} required />
      <Field id="cost" label="Harga modal (opsional)" type="number" min={0} step={1} />
      <Field id="min_stock" label="Batas stok menipis" type="number" min={0} step={1} defaultValue={0} required />
      <Field id="initial_stock" label="Stok awal" type="number" min={0} step={1} defaultValue={0} required />
      <div className="flex flex-col gap-3 sm:col-span-2">
        <FormMessage error={state?.error} info={state?.info} />
        <SubmitButton className="w-full sm:w-fit">Simpan produk</SubmitButton>
      </div>
    </form>
  );
}
