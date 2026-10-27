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
let coffeeId: string;
let teaId: string;
let serviceId: string;

type Checkout = {
  sale_id: string;
  receipt_no: string;
  subtotal: number;
  discount_total: number;
  total: number;
  change: number;
  idempotent: boolean;
};

async function checkout(
  userId: string,
  key: string,
  items: { product_id: string; qty: number }[],
  expectedTotal: number,
  options: { discount?: number; method?: "cash" | "transfer" | "qris"; received?: number | null; acceptPrice?: boolean } = {},
) {
  const method = options.method ?? "cash";
  return asUser(db, userId, async () => {
    const result = await db.query<{ pos_checkout: Checkout }>(
      "select public.pos_checkout($1,$2::jsonb,$3,$4,$5,null,$6,$7,$8)",
      [
        tenantId,
        JSON.stringify(items),
        options.discount ?? 0,
        method,
        method === "cash" ? (options.received ?? expectedTotal) : null,
        key,
        expectedTotal,
        options.acceptPrice ?? false,
      ],
    );
    return result.rows[0].pos_checkout;
  });
}

beforeAll(async () => {
  db = await createTestDb();
  owner = await createUser(db, "pos-owner@contoh.id");
  cashier = await createUser(db, "pos-kasir@contoh.id");
  stockStaff = await createUser(db, "pos-stok@contoh.id");
  otherOwner = await createUser(db, "pos-lain@contoh.id");
  tenantId = await createTenantAs(db, owner, "Toko POS");
  otherTenantId = await createTenantAs(db, otherOwner, "Toko Sebelah");
  await db.query(
    "insert into memberships (tenant_id,user_id,role) values ($1,$2,'kasir'),($1,$3,'staf_stok')",
    [tenantId, cashier, stockStaff],
  );
  coffeeId = await asUser(db, owner, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,'KOPI-POS','Kopi Susu','Minuman','botol',true,18000,9000,2,10)",
      [tenantId],
    );
    return result.rows[0].catalog_create_product;
  });
  teaId = await asUser(db, owner, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,'TEH-POS','Teh Manis','Minuman','gelas',true,12000,4000,2,5)",
      [tenantId],
    );
    return result.rows[0].catalog_create_product;
  });
  serviceId = await asUser(db, owner, async () => {
    const result = await db.query<{ catalog_create_product: string }>(
      "select public.catalog_create_product($1,'JASA-POS','Bungkus Kado','Jasa','layanan',false,5000,null,0,0)",
      [tenantId],
    );
    return result.rows[0].catalog_create_product;
  });
});

afterAll(async () => db.close());

describe("checkout POS", () => {
  it("owner mengatur batas diskon kasir dan perubahan masuk audit", async () => {
    const updated = await asUser(db, owner, () =>
      db.query<{ update_cashier_discount_limit: number }>(
        "select public.update_cashier_discount_limit($1,1500)",
        [tenantId],
      ),
    );
    expect(updated.rows[0].update_cashier_discount_limit).toBe(1500);
    await expect(
      asUser(db, cashier, () => db.query("select public.update_cashier_discount_limit($1,9999)", [tenantId])),
    ).rejects.toThrow("FORBIDDEN");
    const audit = await db.query<{ action: string }>(
      "select action from audit_events where tenant_id=$1 and action='settings.cashier_discount_limit'",
      [tenantId],
    );
    expect(audit.rows).toHaveLength(1);
  });

  it("menyimpan sale, snapshot item, ledger stok, dan audit secara atomik", async () => {
    const key = "11111111-1111-4111-8111-111111111111";
    const sale = await checkout(
      cashier,
      key,
      [{ product_id: coffeeId, qty: 2 }, { product_id: teaId, qty: 1 }, { product_id: serviceId, qty: 1 }],
      53000,
      { received: 60000 },
    );
    expect(sale).toMatchObject({ subtotal: 53000, total: 53000, change: 7000, idempotent: false });
    expect(sale.receipt_no).toMatch(/^STR-\d{8}-0001$/);

    const items = await db.query<{ name: string; price: number; cost: number | null; qty: number }>(
      "select name,price,cost,qty from sale_items where sale_id=$1 order by name",
      [sale.sale_id],
    );
    expect(items.rows).toEqual([
      { name: "Bungkus Kado", price: 5000, cost: null, qty: 1 },
      { name: "Kopi Susu", price: 18000, cost: 9000, qty: 2 },
      { name: "Teh Manis", price: 12000, cost: 4000, qty: 1 },
    ]);
    const balance = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [coffeeId]);
    expect(balance.rows[0].balance).toBe(8);
    const movement = await db.query<{ qty_signed: number; source_id: string }>(
      "select qty_signed,source_id from stock_movements where source_type='sale' and source_id=$1 and product_id=$2",
      [sale.sale_id, coffeeId],
    );
    expect(movement.rows).toEqual([{ qty_signed: -2, source_id: sale.sale_id }]);

    const receipt = await asUser(db, cashier, () =>
      db.query<{ pos_get_sale: { receipt_no: string; items: { name: string }[] } }>(
        "select public.pos_get_sale($1,$2)",
        [tenantId, sale.sale_id],
      ),
    );
    expect(receipt.rows[0].pos_get_sale.receipt_no).toBe(sale.receipt_no);
    expect(receipt.rows[0].pos_get_sale.items).toHaveLength(3);
    await expect(
      asUser(db, otherOwner, () => db.query("select public.pos_get_sale($1,$2)", [tenantId, sale.sale_id])),
    ).rejects.toThrow("FORBIDDEN");
  });

  it("key yang sama mengembalikan sale lama tanpa memotong stok lagi", async () => {
    const key = "22222222-2222-4222-8222-222222222222";
    const first = await checkout(cashier, key, [{ product_id: coffeeId, qty: 1 }], 18000, { received: 20000 });
    const second = await checkout(cashier, key, [{ product_id: coffeeId, qty: 1 }], 18000, { received: 20000 });
    expect(second.sale_id).toBe(first.sale_id);
    expect(second.idempotent).toBe(true);
    const movements = await db.query("select 1 from stock_movements where source_id=$1", [first.sale_id]);
    expect(movements.rows).toHaveLength(1);
  });

  it("menolak stok kurang dan membatalkan seluruh perubahan", async () => {
    const before = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [coffeeId]);
    await expect(
      checkout(cashier, "33333333-3333-4333-8333-333333333333", [{ product_id: coffeeId, qty: 99 }], 1782000, {
        received: 1782000,
      }),
    ).rejects.toThrow("INSUFFICIENT_STOCK");
    const after = await db.query<{ balance: number }>("select balance from stock_balances where product_id=$1", [coffeeId]);
    expect(after.rows[0].balance).toBe(before.rows[0].balance);
    const sales = await db.query("select 1 from sales where idempotency_key='33333333-3333-4333-8333-333333333333'");
    expect(sales.rows).toHaveLength(0);
  });

  it("meminta konfirmasi bila harga server berubah", async () => {
    await db.query("update products set price=20000 where id=$1", [coffeeId]);
    const key = "44444444-4444-4444-8444-444444444444";
    await expect(checkout(cashier, key, [{ product_id: coffeeId, qty: 1 }], 18000, { received: 25000 })).rejects.toThrow(
      "PRICE_CHANGED",
    );
    const accepted = await checkout(cashier, key, [{ product_id: coffeeId, qty: 1 }], 18000, {
      received: 25000,
      acceptPrice: true,
    });
    expect(accepted.total).toBe(20000);
  });

  it("menerapkan batas diskon kasir tetapi owner boleh memberi diskon", async () => {
    await db.query("update tenant_settings set kasir_discount_limit=1000 where tenant_id=$1", [tenantId]);
    await expect(
      checkout(cashier, "55555555-5555-4555-8555-555555555555", [{ product_id: serviceId, qty: 1 }], 3000, {
        discount: 2000,
        received: 5000,
      }),
    ).rejects.toThrow("DISCOUNT_LIMIT_EXCEEDED");
    const ownerSale = await checkout(owner, "66666666-6666-4666-8666-666666666666", [{ product_id: serviceId, qty: 1 }], 3000, {
      discount: 2000,
      received: 5000,
    });
    expect(ownerSale.total).toBe(3000);
  });

  it("menolak uang tunai kurang dan menghitung kembalian di server", async () => {
    await expect(
      checkout(cashier, "99999999-9999-4999-8999-999999999999", [{ product_id: serviceId, qty: 1 }], 5000, {
        received: 4000,
      }),
    ).rejects.toThrow("INSUFFICIENT_PAYMENT");
    const paid = await checkout(cashier, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", [{ product_id: serviceId, qty: 1 }], 5000, {
      received: 10000,
    });
    expect(paid.change).toBe(5000);
  });

  it("menolak staf stok dan produk milik tenant lain", async () => {
    await expect(
      checkout(stockStaff, "77777777-7777-4777-8777-777777777777", [{ product_id: serviceId, qty: 1 }], 5000, {
        received: 5000,
      }),
    ).rejects.toThrow("FORBIDDEN");
    const otherProduct = await asUser(db, otherOwner, async () => {
      const result = await db.query<{ catalog_create_product: string }>(
        "select public.catalog_create_product($1,'LAIN-01','Produk Lain',null,'pcs',false,1000,null,0,0)",
        [otherTenantId],
      );
      return result.rows[0].catalog_create_product;
    });
    await expect(
      checkout(cashier, "88888888-8888-4888-8888-888888888888", [{ product_id: otherProduct, qty: 1 }], 1000, {
        received: 1000,
      }),
    ).rejects.toThrow("PRODUCT_NOT_FOUND");
  });
});

