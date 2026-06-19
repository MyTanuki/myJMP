// เพิ่มคอลัมน์ที่ schema ใหม่ต้องใช้เข้า Turso (prod) — รันก่อน deploy โค้ดใหม่
// Usage: node scripts/migrate-turso.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
// ปลอดภัย: รันซ้ำได้ (ข้ามคอลัมน์ที่มีอยู่แล้ว)
import { createClient } from "@libsql/client";

const url = process.argv[2] ?? process.env.TURSO_DATABASE_URL;
const authToken = process.argv[3] ?? process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Usage: node scripts/migrate-turso.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>");
  process.exit(1);
}

const db = createClient({ url, authToken });

// [table, column] — ทั้งหมดเป็น TEXT nullable
const COLUMNS = [
  ["User", "buildingAccess"],
  ["Tenant", "subdistrict"],
  ["Tenant", "district"],
  ["Tenant", "province"],
  ["Tenant", "postalCode"],
];

async function hasColumn(table, col) {
  const r = await db.execute(`PRAGMA table_info("${table}")`);
  return r.rows.some((row) => String(row.name) === col);
}

for (const [table, col] of COLUMNS) {
  if (await hasColumn(table, col)) {
    console.log(`skip  ${table}.${col} (มีอยู่แล้ว)`);
  } else {
    await db.execute(`ALTER TABLE "${table}" ADD COLUMN "${col}" TEXT`);
    console.log(`added ${table}.${col}`);
  }
}
console.log("\nTurso schema พร้อมสำหรับ deploy แล้ว");
