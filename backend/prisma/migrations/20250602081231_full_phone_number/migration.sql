/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fullPhoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullPhoneNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phoneNumber",
ADD COLUMN     "fullPhoneNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_fullPhoneNumber_key" ON "User"("fullPhoneNumber");
