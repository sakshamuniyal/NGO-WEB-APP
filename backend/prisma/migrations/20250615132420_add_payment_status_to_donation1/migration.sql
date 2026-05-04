-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "donorEmail" TEXT,
ADD COLUMN     "donorName" TEXT,
ADD COLUMN     "donorPhoneNumber" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "phonePeTransactionId" TEXT;
