import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createTenantAs, createTestDb, createUser } from "./pglite";

let db: PGlite;
let owner: string;
let cashier: string;
let otherCashier: string;
let stockStaff: string;
let tenantId: string;
let productId: string;
let cashierSaleId: string;
let ownerSaleId: string;

async function checkout(userId: string, key: string): Promise<string> {
  return asUser(db, userId, async () => {
    const result = await db.query<{ pos_checkout: { sale_id: string } }>(
      "select public.pos_checkout($1,$2::jsonb,0,'cash',20000,null,$3,15000,false)",
      [tenantId, JSON.stringify([{ product_id: productId, qty: 1 }]), key],
    );
    return result.rows[0].pos_checkout.sale_id;
  });
}

beforeAll(async () => {
  db = await createTestDb();
  owner = await createUser(db, "history-owner@contoh.id");
  cashier = await createUser(db, "history-kasir@contoh.id");
  otherCashier = await createUser(db, "history-kasir-lain@contoh.id");
  stockStaff = await createUser(db, "history-stok@contoh.id");
  tenantId = await createTenantAs(db, owner, "Toko Riwayat");
  await db.query(
    "insert into memberships (tenant_id,user_id,role) values ($1,$2,'kasir'),($1,$3,'kasir'),($1,$4,'staf_stok')",
    [tenantId, cashier, otherCashier, stockStaff],
  );
  productId = await asUser(db, owner, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,'VOID-01','Produk Void',null,'pcs',true,15000,7000,2,10)",
      [tenantId],
    );
    return result.rows[0].catalog_create_product;
  });
  cashierSaleId = await checkout(cashier, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  ownerSaleId = await checkout(owner, "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
});

afterAll(async () => db.close());

describe("riwayat transaksi", () => {
  it("owner melihat semua transaksi, kasir hanya transaksi miliknya", async () => {
    const ownerRows = await asUser(db, owner, () =>
      db.query<{ id: string }>("select id from public.pos_list_sales($1,null,null,null)", [tenantId]),
    );
    expect(ownerRows.rows.map((row) => row.id)).toEqual(expect.arrayContaining([cashierSaleId, ownerSaleId]));

    const cashierRows = await asUser(db, cashier, () =>
      db.query<{ id: string }>("select id from public.pos_list_sales($1,null,null,null)", [tenantId]),
    );
    expect(cashierRows.rows).toEqual([{ id: cashierSaleId }]);
    await expect(
      asUser(db, cashier, () => db.query("select public.pos_get_sale($1,$2)", [tenantId, ownerSaleId])),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("mendukung pencarian nomor struk dan memvalidasi rentang tanggal", async () => {
    const receipt = await db.query<{ receipt_no: string }>("select receipt_no from sales where id=$1", [cashierSaleId]);
    const suffix = receipt.rows[0].receipt_no.slice(-4);
    const found = await asUser(db, owner, () =>
      db.query<{ id: string }>("select id from public.pos_list_sales($1,$2,null,null)", [tenantId, suffix]),
    );
    expect(found.rows.some((row) => row.id === cashierSaleId)).toBe(true);
    await expect(
      asUser(db, owner, () =>
        db.query("select * from public.pos_list_sales($1,null,'2026-10-20','2026-10-01')", [tenantId]),
      ),
    ).rejects.toThrow("INVALID_DATE_RANGE");
  });
});

describe("pembatalan transaksi", () => {
  it("kasir mengajukan pembatalan secara idempoten", async () => {
    const first = await asUser(db, cashier, () =>
      db.query<{ pos_request_void: string }>("select public.pos_request_void($1,$2,'Pembeli salah memilih')", [
        tenantId,
        cashierSaleId,
      ]),
    );
    const second = await asUser(db, cashier, () =>
      db.query<{ pos_request_void: string }>("select public.pos_request_void($1,$2,'Alasan kedua')", [
        tenantId,
        cashierSaleId,
      ]),
    );
    expect(second.rows[0].pos_request_void).toBe(first.rows[0].pos_request_void);
    await expect(
      asUser(db, otherCashier, () =>
        db.query("select public.pos_request_void($1,$2,'Bukan transaksi saya')", [tenantId, cashierSaleId]),
      ),
    ).rejects.toThrow("FORBIDDEN");
    await expect(
      asUser(db, stockStaff, () =>
        db.query("select public.pos_request_void($1,$2,'Tidak berwenang')", [tenantId, cashierSaleId]),
      ),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("owner membatalkan sekali, mengembalikan stok, dan mempertahankan histori", async () => {
    const before = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [productId]);
    const voided = await asUser(db, owner, () =>
      db.query<{ pos_void: string }>("select public.pos_void($1,$2,'Transaksi dibatalkan pelanggan')", [
        tenantId,
        cashierSaleId,
      ]),
    );
    expect(voided.rows[0].pos_void).toBe(cashierSaleId);
    const after = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [productId]);
    expect(after.rows[0].balance).toBe(before.rows[0].balance + 1);
    const sale = await db.query<{ status: string; void_reason: string }>("select status,void_reason from sales where id=$1", [cashierSaleId]);
    expect(sale.rows[0]).toEqual({ status: "voided", void_reason: "Transaksi dibatalkan pelanggan" });
    const request = await db.query<{ status: string }>("select status from void_requests where sale_id=$1", [cashierSaleId]);
    expect(request.rows).toEqual([{ status: "approved" }]);

    await asUser(db, owner, () =>
      db.query("select public.pos_void($1,$2,'Percobaan kedua')", [tenantId, cashierSaleId]),
    );
    const movements = await db.query("select 1 from stock_movements where source_type='sale_void' and source_id=$1", [
      cashierSaleId,
    ]);
    expect(movements.rows).toHaveLength(1);
    const finalBalance = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [productId]);
    expect(finalBalance.rows[0].balance).toBe(after.rows[0].balance);
    const reconciliation = await db.query<{ difference: number }>(
      `select b.balance - coalesce(sum(m.qty_signed), 0)::integer as difference
       from stock_balances b
       left join stock_movements m
         on m.tenant_id=b.tenant_id and m.product_id=b.product_id and m.location_id=b.location_id
       where b.tenant_id=$1 and b.product_id=$2
       group by b.balance`,
      [tenantId, productId],
    );
    expect(reconciliation.rows[0].difference).toBe(0);
  });

  it("kasir tidak dapat mengeksekusi pembatalan", async () => {
    await expect(
      asUser(db, cashier, () => db.query("select public.pos_void($1,$2,'Tidak boleh')", [tenantId, ownerSaleId])),
    ).rejects.toThrow("FORBIDDEN");
  });
});

