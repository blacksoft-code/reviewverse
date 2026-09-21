-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'OFFERING';

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "offeringId" TEXT;

-- CreateIndex
CREATE INDEX "Media_offeringId_idx" ON "Media"("offeringId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
