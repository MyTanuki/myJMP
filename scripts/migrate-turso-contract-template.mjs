// สร้างตาราง ContractTemplate บน Turso (prod) — รันตอน deploy ฟีเจอร์เทมเพลตสัญญา
// Usage: node scripts/migrate-turso-contract-template.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
// ปลอดภัย: รันซ้ำได้ (CREATE TABLE IF NOT EXISTS)
import { createClient } from "@libsql/client";

const url = process.argv[2] ?? process.env.TURSO_DATABASE_URL;
const authToken = process.argv[3] ?? process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Usage: node scripts/migrate-turso-contract-template.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>");
  process.exit(1);
}

const db = createClient({ url, authToken });
await db.execute(`CREATE TABLE IF NOT EXISTS "ContractTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
console.log("ตาราง ContractTemplate พร้อมบน Turso แล้ว");
