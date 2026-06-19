// Copy the local SQLite database (dev.db) — schema AND all rows — into a Turso
// database, so production starts with exactly what you have locally.
//
// Usage (from the project root):
//   node scripts/seed-turso.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
//
// Or set TURSO_DATABASE_URL / TURSO_AUTH_TOKEN env vars and run with no args.
// Safe to re-run: tables use IF NOT EXISTS and rows use INSERT OR REPLACE.

import { createClient } from "@libsql/client";

const url = process.argv[2] ?? process.env.TURSO_DATABASE_URL;
const authToken = process.argv[3] ?? process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error(
    "Usage: node scripts/seed-turso.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>"
  );
  process.exit(1);
}

const local = createClient({ url: "file:dev.db" });
const remote = createClient({ url, authToken });

// 1) Schema — copy every CREATE TABLE / INDEX, tables before indexes.
const schema = await local.execute(
  `SELECT type, sql FROM sqlite_master
   WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
   ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END`
);
for (const row of schema.rows) {
  const ddl = String(row.sql)
    .replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS ")
    .replace(/^CREATE UNIQUE INDEX /i, "CREATE UNIQUE INDEX IF NOT EXISTS ")
    .replace(/^CREATE INDEX /i, "CREATE INDEX IF NOT EXISTS ");
  await remote.execute(ddl);
}
console.log(`Schema: ${schema.rows.length} objects created`);

// 2) Data — copy every table's rows in ONE transaction with foreign-key checks
// deferred to commit time (Turso enforces FKs, and tables aren't in dependency
// order, so a child row can land before its parent — defer fixes that).
const tables = await local.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
);
const all = [{ sql: "PRAGMA defer_foreign_keys=ON" }];
const counts = [];
for (const t of tables.rows) {
  const table = String(t.name);
  const data = await local.execute(`SELECT * FROM "${table}"`);
  counts.push([table, data.rows.length]);
  if (data.rows.length === 0) continue;
  const cols = data.columns;
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  for (const r of data.rows) {
    all.push({
      sql: `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`,
      args: cols.map((c) => r[c]),
    });
  }
}
await remote.batch(all, "write");
for (const [table, n] of counts) console.log(`  ${table}: ${n} rows`);

console.log("\nDone — Turso now mirrors your local database.");
