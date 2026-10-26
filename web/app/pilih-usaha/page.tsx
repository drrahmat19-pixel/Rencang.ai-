import type { Metadata } from "next";
import { selectTenantAction, signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/roles";
import { listMyTenants, requireUserId } from "@/lib/tenant";
import { BuatUsahaForm } from "./buat-usaha-form";

export const metadata: Metadata = { title: "Pilih usaha" };


export default async function PilihUsahaPage() {
  const userId = await requireUserId();
  const tenants = await listMyTenants(userId);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="text-center">
        <p className="font-accent text-3xl font-bold text-primary">Rencang AI</p>
      </div>

      {tenants.length > 0 ? (
        <Card className="p-6">
          <h1 className="font-accent text-2xl font-bold">Pilih usaha</h1>
          <ul className="mt-4 flex flex-col gap-3">
            {tenants.map((t) => (
              <li key={t.id}>
                <form action={selectTenantAction}>
                  <input type="hidden" name="tenant_id" value={t.id} />
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center justify-between rounded-control border border-line bg-surface px-4 py-3 text-left hover:border-primary"
                  >
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-sm text-muted">{ROLE_LABEL[t.role]}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="font-accent text-xl font-bold">
          {tenants.length > 0 ? "Atau buat usaha baru" : "Buat usaha Anda"}
        </h2>
        {tenants.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Beri nama usaha Anda untuk mulai memakai Rencang AI.</p>
        ) : null}
        <BuatUsahaForm />
      </Card>

      <form action={signOutAction} className="text-center">
        <Button type="submit" variant="secondary">
          Keluar
        </Button>
      </form>
    </main>
  );
}
