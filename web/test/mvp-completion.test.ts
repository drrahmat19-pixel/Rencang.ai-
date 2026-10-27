import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createTenantAs, createTestDb, createUser } from "./pglite";

let db: PGlite;
let owner: string;
let cashier: string;
let admin: string;
let newStaff: string;
let tenantId: string;
let productId: string;
let serviceId: string;

async function createProduct(
  sku: string,
  name: string,
  price: number,
  cost: number | null,
  stock: number,
  trackStock = true,
): Promise<string> {
  return asUser(db, owner, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,$2,$3,'Uji','pcs',$4,$5,$6,2,$7)",
      [tenantId, sku, name, trackStock, price, cost, stock],
    );
    return result.rows[0].catalog_create_product;
  });
}

async function checkout(
  userId: string,
  key: string,
  items: { product_id: string; qty: number }[],
  expectedTotal: number,
): Promise<string> {
  return asUser(db, userId, async () => {
    const result = await db.query<{ pos_checkout: { sale_id: string } }>(
      "select public.pos_checkout($1,$2::jsonb,0,'cash',$3,null,$4,$3,false)",
      [tenantId, JSON.stringify(items), expectedTotal, key],
    );
    return result.rows[0].pos_checkout.sale_id;
  });
}

beforeAll(async () => {
  db = await createTestDb();
  owner = await createUser(db, "mvp-owner@contoh.id");
  cashier = await createUser(db, "mvp-kasir@contoh.id");
  admin = await createUser(db, "mvp-admin@contoh.id");
  newStaff = await createUser(db, "mvp-staf@contoh.id");
  tenantId = await createTenantAs(db, owner, "Toko MVP");
  await db.query(
    "insert into memberships (tenant_id,user_id,role) values ($1,$2,'kasir'),($1,$3,'admin')",
    [tenantId, cashier, admin],
  );
  productId = await createProduct("MVP-001", "Produk Utama", 10000, 6000, 20);
  serviceId = await createProduct("MVP-JASA", "Jasa Uji", 5000, null, 0, false);
});

afterAll(async () => db.close());

describe("tim dan peran", () => {
  it("owner menambah, melihat, mengubah, dan menonaktifkan anggota dengan audit", async () => {
    const added = await asUser(db, owner, () =>
      db.query<{ team_add_member: string }>("select public.team_add_member($1,$2,'staf_stok')", [tenantId, newStaff]),
    );
    const membershipId = added.rows[0].team_add_member;
    const listed = await asUser(db, owner, () =>
      db.query<{ email: string; role: string; status: string }>(
        "select email,role,status from public.team_list_members($1)",
        [tenantId],
      ),
    );
    expect(listed.rows).toContainEqual({ email: "mvp-staf@contoh.id", role: "staf_stok", status: "active" });

    await asUser(db, owner, () =>
      db.query("select public.team_update_member($1,$2,'kasir','inactive')", [tenantId, membershipId]),
    );
    const noAccess = await asUser(db, newStaff, () => db.query("select 1 from tenants where id=$1", [tenantId]));
    expect(noAccess.rows).toHaveLength(0);
    const audits = await db.query<{ action: string }>(
      "select action from audit_events where tenant_id=$1 and entity_id=$2 order by created_at",
      [tenantId, membershipId],
    );
    expect(audits.rows.map((row) => row.action)).toEqual(["member.add", "member.update"]);
  });

  it("non-owner tidak bisa mengelola anggota dan owner utama terlindungi", async () => {
    await expect(
      asUser(db, admin, () => db.query("select public.team_add_member($1,$2,'kasir')", [tenantId, newStaff])),
    ).rejects.toThrow("FORBIDDEN");
    const ownerMembership = await db.query<{ id: string }>(
      "select id from memberships where tenant_id=$1 and user_id=$2",
      [tenantId, owner],
    );
    await expect(
      asUser(db, owner, () =>
        db.query("select public.team_update_member($1,$2,'admin','inactive')", [tenantId, ownerMembership.rows[0].id]),
      ),
    ).rejects.toThrow("OWNER_MEMBERSHIP_PROTECTED");
  });
});

describe("katalog lengkap", () => {
  it("owner/admin mengubah produk dan perubahan harga/modal tercatat", async () => {
    await asUser(db, admin, () =>
      db.query(
        "select public.catalog_update_product($1,$2,'MVP-001','Produk Utama Baru','Uji','pcs',12000,7000,3)",
        [tenantId, productId],
      ),
    );
    const product = await db.query<{ name: string; price: number; cost: number }>(
      "select name,price,cost from products where id=$1",
      [productId],
    );
    expect(product.rows[0]).toEqual({ name: "Produk Utama Baru", price: 12000, cost: 7000 });
    const audit = await db.query<{ details: { old_price: number; new_price: number; old_cost: number; new_cost: number } }>(
      "select details from audit_events where entity_id=$1 and action='product.update'",
      [productId],
    );
    expect(audit.rows[0].details).toMatchObject({ old_price: 10000, new_price: 12000, old_cost: 6000, new_cost: 7000 });
  });

  it("produk dapat dinonaktifkan tanpa menghapus histori", async () => {
    await asUser(db, owner, () =>
      db.query("select public.catalog_set_product_active($1,$2,false)", [tenantId, productId]),
    );
    const inactive = await db.query<{ is_active: boolean }>("select is_active from products where id=$1", [productId]);
    expect(inactive.rows[0].is_active).toBe(false);
    await asUser(db, owner, () =>
      db.query("select public.catalog_set_product_active($1,$2,true)", [tenantId, productId]),
    );
  });
});

describe("riwayat dan rekonsiliasi stok", () => {
  it("menampilkan mutasi dengan pelaku serta mendeteksi cache yang rusak", async () => {
    await asUser(db, admin, () =>
      db.query("select public.inventory_stock_in($1,$2,3,'Restok pengujian')", [tenantId, productId]),
    );
    const movements = await asUser(db, owner, () =>
      db.query<{ product_name: string; qty_signed: number; actor_email: string }>(
        "select product_name,qty_signed,actor_email from public.inventory_list_movements($1,20)",
        [tenantId],
      ),
    );
    expect(movements.rows).toContainEqual({ product_name: "Produk Utama Baru", qty_signed: 3, actor_email: "mvp-admin@contoh.id" });

    const clean = await asUser(db, owner, () =>
      db.query<{ product_id: string; difference: number }>("select product_id,difference from public.inventory_reconcile($1)", [tenantId]),
    );
    expect(clean.rows.find((row) => row.product_id === productId)?.difference).toBe(0);
    await db.query("update stock_balances set balance=balance+2 where tenant_id=$1 and product_id=$2", [tenantId, productId]);
    const broken = await asUser(db, owner, () =>
      db.query<{ product_id: string; difference: number }>("select product_id,difference from public.inventory_reconcile($1)", [tenantId]),
    );
    expect(broken.rows.find((row) => row.product_id === productId)?.difference).toBe(2);
    await db.query("update stock_balances set balance=balance-2 where tenant_id=$1 and product_id=$2", [tenantId, productId]);
  });
});

describe("beranda, laporan, dan audit", () => {
  let saleOne: string;
  let saleTwo: string;
  let saleVoided: string;

  beforeAll(async () => {
    saleOne = await checkout(cashier, "dddddddd-dddd-4ddd-8ddd-dddddddddddd", [{ product_id: productId, qty: 1 }], 12000);
    saleTwo = await checkout(owner, "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", [{ product_id: serviceId, qty: 1 }], 5000);
    saleVoided = await checkout(cashier, "ffffffff-ffff-4fff-8fff-ffffffffffff", [{ product_id: productId, qty: 1 }], 12000);
    await db.query("update sales set completed_at='2026-10-26 16:30:00+00' where id=$1", [saleOne]);
    await db.query("update sales set completed_at='2026-10-27 02:00:00+00' where id in ($1,$2)", [saleTwo, saleVoided]);
    await asUser(db, owner, () =>
      db.query("select public.pos_void($1,$2,'Uji koreksi laporan')", [tenantId, saleVoided]),
    );
  });

  it("laporan memakai zona WIB, mengecualikan void, dan menghitung estimasi laba", async () => {
    const report = await asUser(db, owner, () =>
      db.query<{
        report_sales: {
          revenue: number;
          transaction_count: number;
          gross_profit_estimate: number;
          missing_cost: boolean;
          daily: { day: string; transaction_count: number }[];
        };
      }>("select public.report_sales($1,'2026-10-26','2026-10-27')", [tenantId]),
    );
    expect(report.rows[0].report_sales).toMatchObject({
      revenue: 17000,
      transaction_count: 2,
      gross_profit_estimate: 10000,
      missing_cost: true,
    });
    expect(report.rows[0].report_sales.daily).toContainEqual({ day: "2026-10-26", transaction_count: 1, revenue: 12000 });
  });

  it("kasir tidak dapat membuka laporan penuh tetapi mendapat ringkasan sendiri", async () => {
    await expect(
      asUser(db, cashier, () => db.query("select public.report_sales($1,'2026-10-01','2026-10-31')", [tenantId])),
    ).rejects.toThrow("FORBIDDEN");
    await checkout(cashier, "abababab-abab-4bab-8bab-abababababab", [{ product_id: serviceId, qty: 1 }], 5000);
    const dashboard = await asUser(db, cashier, () =>
      db.query<{ report_dashboard: { role: string; today_count: number } }>("select public.report_dashboard($1)", [tenantId]),
    );
    expect(dashboard.rows[0].report_dashboard.role).toBe("kasir");
    expect(dashboard.rows[0].report_dashboard.today_count).toBeGreaterThanOrEqual(1);
  });

  it("owner melihat log audit sensitif, kasir ditolak", async () => {
    const log = await asUser(db, owner, () =>
      db.query<{ action: string }>("select action from public.audit_list($1,200)", [tenantId]),
    );
    expect(log.rows.map((row) => row.action)).toEqual(
      expect.arrayContaining(["member.update", "product.update", "inventory.stock_in", "sale.void"]),
    );
    await expect(
      asUser(db, cashier, () => db.query("select * from public.audit_list($1,10)", [tenantId])),
    ).rejects.toThrow("FORBIDDEN");
  });
});

