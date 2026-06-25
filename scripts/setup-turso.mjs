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

// อ่านไฟล์ + ตัด BOM ถ้ามี + ทำให้รันซ้ำได้ (IF NOT EXISTS)
const raw = readFileSync(sqlPath, "utf8")
  .replace(/^﻿/, "")
  .replace(/CREATE TABLE /g, "CREATE TABLE IF NOT EXISTS ")
  .replace(/CREATE UNIQUE INDEX /g, "CREATE UNIQUE INDEX IF NOT EXISTS ")
  .replace(/CREATE INDEX /g, "CREATE INDEX IF NOT EXISTS ");

// แยกเป็นคำสั่งทีละอัน เพื่อรันแยกและ log error ได้ชัด
const statements = raw
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.replace(/--.*$/gm, "").trim().length > 0);

const client = createClient({ url, authToken });

let ok = 0;
try {
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      ok++;
    } catch (e) {
      if (/already exists/i.test(e?.message ?? "")) continue;
      console.error("[setup-turso] คำสั่งล้มเหลว:\n", stmt, "\n", e);
      process.exit(1);
    }
  }
  console.log(`[setup-turso] สร้าง/ยืนยันตารางบน Turso เรียบร้อย (${ok} statements)`);
} finally {
  client.close();
}
