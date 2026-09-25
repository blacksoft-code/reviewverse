-- DropIndex
DROP INDEX "Review_userId_entityId_key";

-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "offeringId" TEXT;

-- CreateIndex
CREATE INDEX "Review_userId_entityId_offeringId_idx" ON "Review"("userId", "entityId", "offeringId");

-- CreateIndex
CREATE INDEX "Review_entityId_isLatest_idx" ON "Review"("entityId", "isLatest");

-- CreateIndex
CREATE INDEX "Review_offeringId_isLatest_idx" ON "Review"("offeringId", "isLatest");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
