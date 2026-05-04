/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Case` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "imageUrl",
DROP COLUMN "pdfUrl",
DROP COLUMN "videoUrl",
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "pdfUrls" TEXT[],
ADD COLUMN     "videoUrls" TEXT[];
