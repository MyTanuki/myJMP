// ซิงค์สคีมาขึ้น Turso (libSQL) ตอน deploy บน Vercel
// - สร้างตารางที่ยังไม่มี (CREATE TABLE IF NOT EXISTS)
// - เติมคอลัมน์ที่ขาดให้ตารางเดิมอัตโนมัติ (ALTER TABLE ADD COLUMN) แบบไม่ลบข้อมูล
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

const statements = raw
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.replace(/--.*$/gm, "").trim().length > 0);

// แตกคำสั่ง ALTER ADD COLUMN จากแต่ละ CREATE TABLE (เพื่อเติมคอลัมน์ที่ขาด)
function columnAlters(stmt) {
  const m = stmt.match(/CREATE TABLE(?: IF NOT EXISTS)? "([^"]+)"/);
  if (!m) return [];
  const table = m[1];
  const alters = [];
  for (let line of stmt.split("\n")) {
    line = line.trim().replace(/,$/, "");
    if (!line.startsWith('"')) continue; // เฉพาะบรรทัดนิยามคอลัมน์
    if (/PRIMARY KEY/i.test(line)) continue; // เพิ่มคอลัมน์ PK ไม่ได้
    alters.push(`ALTER TABLE "${table}" ADD COLUMN ${line}`);
  }
  return alters;
}

const client = createClient({ url, authToken });

let created = 0;
let added = 0;
try {
  // 1) สร้างตาราง/อินเด็กซ์ที่ยังไม่มี
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      created++;
    } catch (e) {
      if (/already exists/i.test(e?.message ?? "")) continue;
      console.error("[setup-turso] คำสั่งล้มเหลว:\n", stmt, "\n", e);
      process.exit(1);
    }
  }

  // 2) เติมคอลัมน์ที่ขาดให้ตารางเดิม (ตัวที่มีอยู่แล้วจะ error "duplicate" → ข้าม)
  for (const stmt of statements) {
    for (const alter of columnAlters(stmt)) {
      try {
        await client.execute(alter);
        added++;
      } catch {
        // คอลัมน์มีอยู่แล้ว / เพิ่มไม่ได้ → ข้าม (best-effort)
      }
    }
  }

  console.log(
    `[setup-turso] ซิงค์สคีมา Turso เรียบร้อย (สร้าง ${created} statements, เติมคอลัมน์ใหม่ ${added})`
  );
} finally {
  client.close();
}
