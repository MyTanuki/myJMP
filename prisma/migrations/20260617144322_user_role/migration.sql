-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "dormName" TEXT NOT NULL DEFAULT 'หอพักของฉัน',
    "waterRate" REAL NOT NULL DEFAULT 18,
    "elecRate" REAL NOT NULL DEFAULT 8,
    "businessType" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "billNote" TEXT,
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNo" TEXT,
    "lateFeePerDay" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("address", "bankAccountName", "bankAccountNo", "bankName", "billNote", "businessType", "createdAt", "dormName", "elecRate", "email", "id", "lateFeePerDay", "name", "passwordHash", "taxId", "waterRate") SELECT "address", "bankAccountName", "bankAccountNo", "bankName", "billNote", "businessType", "createdAt", "dormName", "elecRate", "email", "id", "lateFeePerDay", "name", "passwordHash", "taxId", "waterRate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
