-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dormName" TEXT NOT NULL DEFAULT 'หอพักของฉัน',
    "waterRate" REAL NOT NULL DEFAULT 18,
    "elecRate" REAL NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'ห้องพัดลม',
    "basePrice" REAL NOT NULL DEFAULT 3000,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "idCard" TEXT,
    "deposit" REAL NOT NULL DEFAULT 0,
    "moveInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT NOT NULL,
    CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "rent" REAL NOT NULL DEFAULT 0,
    "prevWater" REAL NOT NULL DEFAULT 0,
    "currWater" REAL NOT NULL DEFAULT 0,
    "prevElec" REAL NOT NULL DEFAULT 0,
    "currElec" REAL NOT NULL DEFAULT 0,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_roomId_period_key" ON "Invoice"("roomId", "period");
