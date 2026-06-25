// สร้างตารางบน Turso (libSQL) ตอน deploy บน Vercel
// ทำงานเฉพาะเมื่อ DATABASE_URL เป็น libsql:// + มี TURSO_AUTH_TOKEN
// บนเครื่อง local (file:./dev.db) จะข้ามทันที เพื่อไม่กระทบ dev
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url.startsWith("libsql://") || !authToken) {
  console.log("[setup-turso] ข้าม (ไม่ใช่ Turso) — local/build ปกติ");
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, "..", "prisma", "turso-schema.sql");

// ทำให้รันซ้ำได้: เพิ่ม IF NOT EXISTS
const sql = readFileSync(sqlPath, "utf8")
  .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
  .replace(/CREATE UNIQUE INDEX /g, "CREATE UNIQUE INDEX IF NOT EXISTS ")
  .replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");

const client = createClient({ url, authToken });

try {
  await client.executeMultiple(sql);
  console.log("[setup-turso] สร้าง/ยืนยันตารางบน Turso เรียบร้อย");
} catch (e) {
  console.error("[setup-turso] ล้มเหลว:", e);
  process.exit(1);
} finally {
  client.close();
}
