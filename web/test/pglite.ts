import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SUPABASE_DIR = path.resolve(__dirname, "../../supabase");
const MIGRATIONS_DIR = path.join(SUPABASE_DIR, "migrations");

export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_.+\.sql$/.test(f))
    .sort();
}

/** Terapkan semua migrasi berurutan (shim harus sudah ada). */
export async function applyMigrations(db: PGlite) {
  for (const file of migrationFiles()) {
    await db.exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
  }
}

/** DB baru: shim Supabase + semua migrasi. */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(path.join(SUPABASE_DIR, "test-shim.sql"), "utf8"));
  await applyMigrations(db);
  return db;
}

/** Buat user di auth.users (sebagai superuser), kembalikan id. */
export async function createUser(db: PGlite, email: string): Promise<string> {
  const res = await db.query<{ id: string }>(
    "insert into auth.users (email) values ($1) returning id",
    [email],
  );
  return res.rows[0].id;
}

/**
 * Jalankan fn sebagai user `authenticated` dengan claim sub = userId (RLS berlaku).
 * userId null = sesi tanpa login (claim kosong).
 */
export async function asUser<T>(db: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.exec("set role authenticated");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

/** Panggil create_tenant sebagai user; kembalikan tenant_id. */
export async function createTenantAs(db: PGlite, userId: string, name: string): Promise<string> {
  return asUser(db, userId, async () => {
    const res = await db.query<{ create_tenant: string }>("select public.create_tenant($1)", [name]);
    return res.rows[0].create_tenant;
  });
}
