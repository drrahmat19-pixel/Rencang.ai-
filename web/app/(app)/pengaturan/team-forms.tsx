"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTeamMemberAction, updateTeamMemberAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import type { TeamMember } from "@/lib/team";

const selectClass = "min-h-11 rounded-control border border-line bg-surface px-3 text-sm";

export function AddTeamMemberForm() {
  const [state, action] = useActionState(createTeamMemberAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.info) ref.current?.reset(); }, [state?.info]);
  return (
    <form ref={ref} action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <Field id="email" label="Email anggota" type="email" placeholder="anggota@usaha.id" required />
      <Field id="password" label="Kata sandi sementara" type="password" minLength={8} required hint="Berikan secara pribadi dan minta anggota menggantinya." />
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-semibold">Peran</label>
        <select id="role" name="role" className={selectClass} defaultValue="kasir">
          <option value="kasir">Kasir</option><option value="staf_stok">Staf stok</option><option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex items-end"><SubmitButton className="w-full">Tambah anggota</SubmitButton></div>
      <div className="sm:col-span-2"><FormMessage error={state?.error} info={state?.info} /></div>
    </form>
  );
}

export function TeamMemberForm({ member }: { member: TeamMember }) {
  const [state, action] = useActionState(updateTeamMemberAction.bind(null, member.id), undefined);
  if (member.role === "owner") return <p className="text-sm text-muted">Pemilik utama · Aktif</p>;
  return (
    <form action={action} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-xs font-semibold">Peran
        <select name="role" defaultValue={member.role} className={selectClass}>
          <option value="kasir">Kasir</option><option value="staf_stok">Staf stok</option><option value="admin">Admin</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold">Status
        <select name="status" defaultValue={member.status} className={selectClass}>
          <option value="active">Aktif</option><option value="inactive">Nonaktif</option>
        </select>
      </label>
      <SubmitButton variant="secondary">Simpan</SubmitButton>
      <div className="sm:col-span-3"><FormMessage error={state?.error} info={state?.info} /></div>
    </form>
  );
}
