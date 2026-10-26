import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { applyMigrations, asUser, createTenantAs, createTestDb, createUser } from "./pglite";

let db: PGlite;
let userA: string;
let userB: string;
let tenantA: string;
let tenantB: string;

beforeAll(async () => {
  db = await createTestDb();
  userA = await createUser(db, "a@contoh.id");
  userB = await createUser(db, "b@contoh.id");
  tenantA = await createTenantAs(db, userA, "Toko Sumber Rejeki");
  tenantB = await createTenantAs(db, userB, "Warung Bu Tini");
});

afterAll(async () => {
  await db.close();
});

describe("create_tenant", () => {
  it("membuat tenant + owner aktif + lokasi default + pengaturan default + audit", async () => {
    const t = await db.query<{ name: string }>("select name from tenants where id = $1", [tenantA]);
    expect(t.rows[0].name).toBe("Toko Sumber Rejeki");

    const m = await db.query<{ user_id: string; role: string; status: string }>(
      "select user_id, role, status from memberships where tenant_id = $1",
      [tenantA],
    );
    expect(m.rows).toEqual([{ user_id: userA, role: "owner", status: "active" }]);

    const l = await db.query<{ is_default: boolean }>("select is_default from locations where tenant_id = $1", [tenantA]);
    expect(l.rows).toEqual([{ is_default: true }]);

    const s = await db.query<{ timezone: string; kasir_discount_limit: number; receipt_prefix: string }>(
      "select timezone, kasir_discount_limit, receipt_prefix from tenant_settings where tenant_id = $1",
      [tenantA],
    );
    expect(s.rows).toEqual([{ timezone: "Asia/Jakarta", kasir_discount_limit: 0, receipt_prefix: "STR" }]);

    const a = await db.query<{ action: string; actor_id: string }>(
      "select action, actor_id from audit_events where tenant_id = $1",
      [tenantA],
    );
    expect(a.rows).toEqual([{ action: "tenant.create", actor_id: userA }]);
  });

  it("menolak tanpa login (UNAUTHENTICATED)", async () => {
    await expect(
      asUser(db, null, () => db.query("select public.create_tenant('Toko Gelap')")),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  it("menolak nama kosong/terlalu pendek (INVALID_NAME)", async () => {
    await expect(
      asUser(db, userA, () => db.query("select public.create_tenant('  x ')")),
    ).rejects.toThrow("INVALID_NAME");
  });

  it("user tidak bisa menulis langsung ke tabel (hanya lewat RPC)", async () => {
    await expect(
      asUser(db, userA, () => db.query("insert into tenants (name) values ('Bobol')")),
    ).rejects.toThrow();
    await expect(
      asUser(db, userA, () =>
        db.query("insert into memberships (tenant_id, user_id, role) values ($1, $2, 'owner')", [tenantB, userA]),
      ),
    ).rejects.toThrow();
  });
});

describe("RLS lintas tenant", () => {
  const tables: Array<[string, string]> = [
    ["tenants", "id"],
    ["memberships", "tenant_id"],
    ["locations", "tenant_id"],
    ["tenant_settings", "tenant_id"],
    ["audit_events", "tenant_id"],
  ];

  for (const [table, col] of tables) {
    it(`${table}: user A hanya melihat tenant A, tidak tenant B`, async () => {
      const rows = await asUser(db, userA, async () =>
        (await db.query<{ tid: string }>(`select ${col} as tid from ${table}`)).rows,
      );
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.tid === tenantA)).toBe(true);

      const peek = await asUser(db, userA, async () =>
        (await db.query(`select 1 from ${table} where ${col} = $1`, [tenantB])).rows,
      );
      expect(peek).toHaveLength(0);
    });
  }

  it("sesi tanpa login tidak melihat apa pun", async () => {
    for (const [table] of tables) {
      const rows = await asUser(db, null, async () => (await db.query(`select 1 from ${table}`)).rows);
      expect(rows).toHaveLength(0);
    }
  });

  it("anggota nonaktif kehilangan akses; peran non-admin tidak membaca audit", async () => {
    const userC = await createUser(db, "c@contoh.id");
    await db.query("insert into memberships (tenant_id, user_id, role) values ($1, $2, 'kasir')", [tenantA, userC]);

    const settings = await asUser(db, userC, async () => (await db.query("select 1 from tenant_settings")).rows);
    expect(settings).toHaveLength(1);
    const audit = await asUser(db, userC, async () => (await db.query("select 1 from audit_events")).rows);
    expect(audit).toHaveLength(0);

    await db.query("update memberships set status = 'inactive' where user_id = $1", [userC]);
    const after = await asUser(db, userC, async () => (await db.query("select 1 from tenants")).rows);
    expect(after).toHaveLength(0);
  });
});

describe("migrasi", () => {
  it("diterapkan 2x pada DB yang sama tetap lolos dan data tetap utuh", async () => {
    await expect(applyMigrations(db)).resolves.toBeUndefined();
    const t = await db.query("select 1 from tenants");
    expect(t.rows.length).toBeGreaterThanOrEqual(2);
  });
});
