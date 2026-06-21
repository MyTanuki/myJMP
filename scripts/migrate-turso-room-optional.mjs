// ทำให้ Tenant.roomId เป็น nullable บน Turso (prod) — รันก่อน/ตอน deploy ฟีเจอร์ "เพิ่มผู้เช่าไม่ต้องเลือกห้อง"
// SQLite เปลี่ยน NOT NULL -> nullable ไม่ได้ด้วย ALTER จึงต้องสร้างตารางใหม่+ย้ายข้อมูล (ตรงกับ migration ของ Prisma)
// Usage: node scripts/migrate-turso-room-optional.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
// ปลอดภัย: รันซ้ำได้ (ข้ามถ้า roomId เป็น nullable อยู่แล้ว)
import { createClient } from "@libsql/client";

const url = process.argv[2] ?? process.env.TURSO_DATABASE_URL;
const authToken = process.argv[3] ?? process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Usage: node scripts/migrate-turso-room-optional.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>");
  process.exit(1);
}

const db = createClient({ url, authToken });

const info = await db.execute('PRAGMA table_info("Tenant")');
const roomId = info.rows.find((r) => String(r.name) === "roomId");
if (!roomId) {
  console.error("ไม่พบคอลัมน์ Tenant.roomId");
  process.exit(1);
}
if (Number(roomId.notnull) === 0) {
  console.log("Tenant.roomId เป็น nullable อยู่แล้ว — ข้าม");
  process.exit(0);
}

const sql = `
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "idCard" TEXT,
    "vehiclePlate" TEXT,
    "address" TEXT,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "deposit" REAL NOT NULL DEFAULT 0,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "moveInWater" REAL,
    "moveInElec" REAL,
    "contractNote" TEXT,
    "moveInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tenant" ("active", "address", "contractEnd", "contractNote", "contractStart", "createdAt", "deposit", "depositPaid", "district", "id", "idCard", "moveInDate", "moveInElec", "moveInWater", "name", "phone", "postalCode", "province", "roomId", "subdistrict", "vehiclePlate") SELECT "active", "address", "contractEnd", "contractNote", "contractStart", "createdAt", "deposit", "depositPaid", "district", "id", "idCard", "moveInDate", "moveInElec", "moveInWater", "name", "phone", "postalCode", "province", "roomId", "subdistrict", "vehiclePlate" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
`;

await db.executeMultiple(sql);
console.log("สำเร็จ — Tenant.roomId เป็น nullable บน Turso แล้ว");
