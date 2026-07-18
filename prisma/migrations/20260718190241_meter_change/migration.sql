-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "rent" REAL NOT NULL DEFAULT 0,
    "prevWater" REAL NOT NULL DEFAULT 0,
    "currWater" REAL NOT NULL DEFAULT 0,
    "prevElec" REAL NOT NULL DEFAULT 0,
    "currElec" REAL NOT NULL DEFAULT 0,
    "waterMeterChanged" BOOLEAN NOT NULL DEFAULT false,
    "waterOldEnd" REAL NOT NULL DEFAULT 0,
    "elecMeterChanged" BOOLEAN NOT NULL DEFAULT false,
    "elecOldEnd" REAL NOT NULL DEFAULT 0,
    "waterRate" REAL NOT NULL DEFAULT 18,
    "elecRate" REAL NOT NULL DEFAULT 8,
    "other" REAL NOT NULL DEFAULT 0,
    "otherNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "dueDate" DATETIME,
    "paidDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    "tenantId" TEXT,
    CONSTRAINT "Invoice_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("createdAt", "currElec", "currWater", "dueDate", "elecRate", "id", "other", "otherNote", "paidDate", "period", "prevElec", "prevWater", "rent", "roomId", "status", "tenantId", "waterRate") SELECT "createdAt", "currElec", "currWater", "dueDate", "elecRate", "id", "other", "otherNote", "paidDate", "period", "prevElec", "prevWater", "rent", "roomId", "status", "tenantId", "waterRate" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_roomId_period_key" ON "Invoice"("roomId", "period");
CREATE TABLE "new_MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "water" REAL NOT NULL DEFAULT 0,
    "elec" REAL NOT NULL DEFAULT 0,
    "waterMeterChanged" BOOLEAN NOT NULL DEFAULT false,
    "waterOldEnd" REAL NOT NULL DEFAULT 0,
    "elecMeterChanged" BOOLEAN NOT NULL DEFAULT false,
    "elecOldEnd" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    CONSTRAINT "MeterReading_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MeterReading" ("createdAt", "elec", "id", "period", "roomId", "water") SELECT "createdAt", "elec", "id", "period", "roomId", "water" FROM "MeterReading";
DROP TABLE "MeterReading";
ALTER TABLE "new_MeterReading" RENAME TO "MeterReading";
CREATE UNIQUE INDEX "MeterReading_roomId_period_key" ON "MeterReading"("roomId", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
