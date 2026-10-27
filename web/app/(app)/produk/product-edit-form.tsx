"use client";

import { useActionState } from "react";
import { setProductActiveAction, updateProductAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import type { ProductListItem } from "@/lib/catalog";

export function ProductEditForm({ product }: { product: ProductListItem }) {
  const [state, action] = useActionState(updateProductAction.bind(null, product.id), undefined);
  const [statusState, statusAction] = useActionState(setProductActiveAction.bind(null, product.id, !product.is_active), undefined);
  return (
    <details className="mt-4 border-t border-line pt-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary">Edit produk</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field id={`sku-${product.id}`} name="sku" label="SKU" defaultValue={product.sku} required />
        <Field id={`name-${product.id}`} name="name" label="Nama" defaultValue={product.name} required />
        <Field id={`category-${product.id}`} name="category" label="Kategori" defaultValue={product.category ?? ""} />
        <Field id={`unit-${product.id}`} name="unit" label="Satuan" defaultValue={product.unit} required />
        <Field id={`price-${product.id}`} name="price" label="Harga jual" type="number" min={0} defaultValue={product.price} required />
        <Field id={`cost-${product.id}`} name="cost" label="Harga modal" type="number" min={0} defaultValue={product.cost ?? ""} />
        <Field id={`min-${product.id}`} name="min_stock" label="Batas stok" type="number" min={0} defaultValue={product.min_stock} required />
        <div className="flex flex-col justify-end gap-2">
          <SubmitButton>Simpan perubahan</SubmitButton>
        </div>
        <div className="sm:col-span-2"><FormMessage error={state?.error} info={state?.info} /></div>
      </form>
      <form action={statusAction} className="mt-3 space-y-2">
        <SubmitButton variant={product.is_active ? "danger" : "secondary"}>
          {product.is_active ? "Nonaktifkan produk" : "Aktifkan kembali"}
        </SubmitButton>
        <FormMessage error={statusState?.error} info={statusState?.info} />
      </form>
    </details>
  );
}
