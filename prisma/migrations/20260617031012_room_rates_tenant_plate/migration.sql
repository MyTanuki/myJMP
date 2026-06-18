-- AlterTable
ALTER TABLE "Room" ADD COLUMN "elecRate" REAL;
ALTER TABLE "Room" ADD COLUMN "waterRate" REAL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "vehiclePlate" TEXT;
