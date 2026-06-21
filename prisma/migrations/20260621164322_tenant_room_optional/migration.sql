-- RedefineTables
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
