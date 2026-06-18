-- CreateTable
CREATE TABLE "MoveInItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "MoveInItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tenant" ("active", "contractEnd", "contractStart", "createdAt", "deposit", "id", "idCard", "moveInDate", "name", "phone", "roomId", "vehiclePlate") SELECT "active", "contractEnd", "contractStart", "createdAt", "deposit", "id", "idCard", "moveInDate", "name", "phone", "roomId", "vehiclePlate" FROM "Tenant";
DROP TABLE "Tenant";
ALTER TABLE "new_Tenant" RENAME TO "Tenant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
