import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createTenantAs, createTestDb, createUser } from "./pglite";

let db: PGlite;
let owner: string;
let cashier: string;
let stockStaff: string;
let otherOwner: string;
let tenantId: string;
let otherTenantId: string;

async function createProduct(userId: string, sku = "KOPI-001", trackStock = true, initialStock = 10) {
  return asUser(db, userId, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [tenantId, sku, "Kopi Susu", "Minuman", "botol", trackStock, 18000, 9000, 3, initialStock],
    );
    return result.rows[0].catalog_create_product;
  });
}

beforeAll(async () => {
  db = await createTestDb();
  owner = await createUser(db, "owner@contoh.id");
  cashier = await createUser(db, "kasir@contoh.id");
  stockStaff = await createUser(db, "stok@contoh.id");
  otherOwner = await createUser(db, "lain@contoh.id");
  tenantId = await createTenantAs(db, owner, "Kedai Rencang");
  otherTenantId = await createTenantAs(db, otherOwner, "Toko Lain");
  await db.query("insert into memberships (tenant_id,user_id,role) values ($1,$2,'kasir'),($1,$3,'staf_stok')", [
    tenantId,
    cashier,
    stockStaff,
  ]);
});

afterAll(async () => db.close());

describe("katalog produk", () => {
  it("owner membuat barang dengan stok awal dan audit", async () => {
    const productId = await createProduct(owner);
    const balance = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [productId]);
    expect(balance.rows[0].balance).toBe(10);
    const movement = await db.query<{ type: string; qty_signed: number }>(
      "select type,qty_signed from stock_movements where product_id=$1",
      [productId],
    );
    expect(movement.rows).toEqual([{ type: "opening", qty_signed: 10 }]);
    const audit = await db.query<{ action: string }>("select action from audit_events where entity_id=$1", [productId]);
    expect(audit.rows).toContainEqual({ action: "product.create" });
  });

  it("SKU aktif unik per tenant", async () => {
    await expect(createProduct(owner)).rejects.toThrow("DUPLICATE_SKU");
  });

  it("kasir tidak bisa membuat produk dan tidak melihat harga modal", async () => {
    await expect(createProduct(cashier, "GAGAL-01")).rejects.toThrow("FORBIDDEN");
    const rows = await asUser(db, cashier, async () =>
      (await db.query<{ cost: number | null }>("select cost from public.catalog_list_products($1)", [tenantId])).rows,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.cost === null)).toBe(true);
  });

  it("anggota tidak dapat membaca katalog tenant lain", async () => {
    await expect(
      asUser(db, owner, () => db.query("select * from public.catalog_list_products($1)", [otherTenantId])),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("produk jasa tidak membuat saldo atau mutasi stok", async () => {
    const productId = await createProduct(owner, "JASA-001", false, 99);
    const balances = await db.query("select 1 from stock_balances where product_id=$1", [productId]);
    const movements = await db.query("select 1 from stock_movements where product_id=$1", [productId]);
    expect(balances.rows).toHaveLength(0);
    expect(movements.rows).toHaveLength(0);
  });
});

describe("mutasi stok", () => {
  it("staf stok dapat mencatat stok masuk", async () => {
    const product = await db.query<{ id: string }>("select id from products where tenant_id=$1 and sku='KOPI-001'", [tenantId]);
    const next = await asUser(db, stockStaff, () =>
      db.query<{ inventory_stock_in: number }>("select public.inventory_stock_in($1,$2,5,'Belanja pemasok')", [
        tenantId,
        product.rows[0].id,
      ]),
    );
    expect(next.rows[0].inventory_stock_in).toBe(15);
  });

  it("staf stok hanya boleh koreksi negatif dan stok tidak boleh minus", async () => {
    const product = await db.query<{ id: string }>("select id from products where tenant_id=$1 and sku='KOPI-001'", [tenantId]);
    await expect(
      asUser(db, stockStaff, () =>
        db.query("select public.inventory_adjust($1,$2,1,'Tambah manual')", [tenantId, product.rows[0].id]),
      ),
    ).rejects.toThrow("POSITIVE_ADJUSTMENT_FORBIDDEN");
    const adjusted = await asUser(db, stockStaff, () =>
      db.query<{ inventory_adjust: number }>("select public.inventory_adjust($1,$2,-2,'Barang rusak')", [
        tenantId,
        product.rows[0].id,
      ]),
    );
    expect(adjusted.rows[0].inventory_adjust).toBe(13);
    await expect(
      asUser(db, owner, () =>
        db.query("select public.inventory_adjust($1,$2,-99,'Hitung fisik')", [tenantId, product.rows[0].id]),
      ),
    ).rejects.toThrow("INSUFFICIENT_STOCK");
  });

  it("tabel operasional tidak dapat ditulis langsung", async () => {
    await expect(
      asUser(db, owner, () => db.query("update stock_balances set balance=999 where tenant_id=$1", [tenantId])),
    ).rejects.toThrow();
  });
});
