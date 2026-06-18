-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "building" TEXT NOT NULL DEFAULT 'A',
    "number" TEXT NOT NULL,
    "name" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'ห้องพัดลม',
    "basePrice" REAL NOT NULL DEFAULT 3000,
    "rentFurniture" REAL NOT NULL DEFAULT 0,
    "rentCommon" REAL NOT NULL DEFAULT 0,
    "rentAircon" REAL NOT NULL DEFAULT 0,
    "rentFridge" REAL NOT NULL DEFAULT 0,
    "rentTv" REAL NOT NULL DEFAULT 0,
    "rentDiscount" REAL NOT NULL DEFAULT 0,
    "waterRate" REAL,
    "elecRate" REAL,
    "note" TEXT,
    "publicToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Room" ("basePrice", "building", "createdAt", "elecRate", "floor", "id", "name", "note", "number", "publicToken", "sortOrder", "type", "waterRate") SELECT "basePrice", "building", "createdAt", "elecRate", "floor", "id", "name", "note", "number", "publicToken", "sortOrder", "type", "waterRate" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
