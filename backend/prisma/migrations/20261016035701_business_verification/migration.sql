-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationDocType" AS ENUM ('NID', 'PASSPORT', 'BUSINESS_REGISTRATION', 'TRADE_LICENSE', 'OTHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION_UPDATE';

-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EntityVerification" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "applicantNote" VARCHAR(1000),
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" VARCHAR(1000),
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "type" "VerificationDocType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityVerification_entityId_createdAt_idx" ON "EntityVerification"("entityId", "createdAt");

-- CreateIndex
CREATE INDEX "EntityVerification_status_createdAt_idx" ON "EntityVerification"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocument_storageKey_key" ON "VerificationDocument"("storageKey");

-- CreateIndex
CREATE INDEX "VerificationDocument_verificationId_idx" ON "VerificationDocument"("verificationId");

-- AddForeignKey
ALTER TABLE "EntityVerification" ADD CONSTRAINT "EntityVerification_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityVerification" ADD CONSTRAINT "EntityVerification_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityVerification" ADD CONSTRAINT "EntityVerification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "EntityVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
