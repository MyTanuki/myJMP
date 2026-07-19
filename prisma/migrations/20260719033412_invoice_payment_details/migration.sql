-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "cancelNote" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paidAmount" REAL;
ALTER TABLE "Invoice" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paymentNote" TEXT;
