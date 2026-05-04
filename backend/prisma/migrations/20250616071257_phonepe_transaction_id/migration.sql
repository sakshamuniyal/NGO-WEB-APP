/*
  Warnings:

  - You are about to drop the column `phonePeTransactionId` on the `Donation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "phonePeTransactionId",
ADD COLUMN     "gatewayTransactionId" TEXT;
