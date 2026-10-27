import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/money";
import { getPosSettings } from "@/lib/pos";
import { mapError } from "@/lib/errors";
import { listAuditEvents } from "@/lib/reports";
import { ROLE_LABEL } from "@/lib/roles";
import { listTeamMembers } from "@/lib/team";
import { requireTenant } from "@/lib/tenant";
import { DiscountLimitForm } from "./discount-limit-form";
import { AddTeamMemberForm, TeamMemberForm } from "./team-forms";

export const metadata: Metadata = { title: "Pengaturan" };
const ACTION_LABEL: Record<string, string> = { "member.add": "Anggota ditambahkan", "member.update": "Akses anggota diubah", "product.update": "Produk diubah", "product.status": "Status produk diubah", "pos.void": "Transaksi dibatalkan", "pos.void_request": "Pembatalan diajukan", "settings.discount": "Batas diskon diubah" };

export default async function SettingsPage() {
  const tenant = await requireTenant();
  const { cashierDiscountLimit } = await getPosSettings(tenant.id);
  const team = tenant.role === "owner" ? await listTeamMembers(tenant.id) : null;
  const audit = tenant.role === "owner" ? await listAuditEvents(tenant.id, 50) : null;
  return <div className="flex flex-col gap-5">
    <div><h1 className="font-accent text-2xl font-bold">Akun &amp; Pengaturan</h1><p className="mt-1 text-sm text-muted">Kelola operasional {tenant.name}. Anda masuk sebagai {ROLE_LABEL[tenant.role]}.</p></div>
    <Card><h2 className="text-xl font-bold">Diskon transaksi</h2>{tenant.role === "owner" ? <DiscountLimitForm currentLimit={cashierDiscountLimit} /> : <p className="mt-2 text-sm text-muted">Batas diskon kasir: <strong>{formatRupiah(cashierDiscountLimit)}</strong>. Hanya pemilik yang dapat mengubahnya.</p>}</Card>
    {team ? <Card><h2 className="text-xl font-bold">Tim usaha</h2><p className="mt-1 text-sm text-muted">Buat akun anggota, atur peran, atau hentikan aksesnya.</p><AddTeamMemberForm />{team.error ? <p className="mt-3 text-danger">{mapError(team.error)}</p> : <div className="mt-5 divide-y divide-line">{team.members.map((member) => <div key={member.id} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{member.email}</p><p className="text-xs text-muted">{ROLE_LABEL[member.role]} · {member.status === "active" ? "Aktif" : "Nonaktif"}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${member.status === "active" ? "bg-[#e9f3ed] text-success" : "bg-ivory text-muted"}`}>{member.status === "active" ? "Aktif" : "Nonaktif"}</span></div><TeamMemberForm member={member} /></div>)}</div>}</Card> : null}
    {audit ? <Card><h2 className="text-xl font-bold">Log audit</h2><p className="mt-1 text-sm text-muted">50 perubahan terbaru untuk membantu penelusuran aktivitas penting.</p>{audit.error ? <p className="mt-3 text-danger">{mapError(audit.error)}</p> : <div className="mt-3 divide-y divide-line">{audit.events.length === 0 ? <p className="py-3 text-sm text-muted">Belum ada aktivitas tercatat.</p> : audit.events.map((event) => <div key={event.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{ACTION_LABEL[event.action] ?? event.action}</p><p className="text-xs text-muted">{event.actor_email ?? "Sistem"} · {event.entity_type}</p></div><time className="shrink-0 text-right text-xs text-muted">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(event.created_at))}</time></div>)}</div>}</Card> : null}
  </div>;
}
