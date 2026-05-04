/*
  Warnings:

  - A unique constraint covering the columns `[receiptNo]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "receiptNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNo_key" ON "Receipt"("receiptNo");
