-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "buildingAccess" TEXT,
    "dormName" TEXT NOT NULL DEFAULT 'หอพักของฉัน',
    "waterRate" REAL NOT NULL DEFAULT 18,
    "elecRate" REAL NOT NULL DEFAULT 8,
    "phone" TEXT,
    "billDay" INTEGER,
    "dueDay" INTEGER,
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

-- CreateTable
CREATE TABLE "ServicePreset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Room" (
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

-- CreateTable
CREATE TABLE "MeterReading" (
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

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipient" TEXT NOT NULL,
    "carrier" TEXT,
    "arrivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickedUp" BOOLEAN NOT NULL DEFAULT false,
    "pickedUpAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Parcel_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "roomId" TEXT,
    CONSTRAINT "Issue_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "deposit" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Asset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plate" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'car',
    "brand" TEXT,
    "color" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    "tenantId" TEXT,
    CONSTRAINT "Vehicle_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Transaction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "prefix" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT,
    "phone" TEXT,
    "idCard" TEXT,
    "idCardImage" TEXT,
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
    "contractBody" TEXT,
    "moveInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractStart" DATETIME,
    "contractEnd" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roomId" TEXT,
    CONSTRAINT "Tenant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoveInItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "MoveInItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "invoiceId" TEXT NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_roomId_period_key" ON "MeterReading"("roomId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_roomId_period_key" ON "Invoice"("roomId", "period");

