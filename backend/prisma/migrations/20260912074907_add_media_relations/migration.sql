-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "entityPostId" TEXT;

-- CreateIndex
CREATE INDEX "Media_entityPostId_idx" ON "Media"("entityPostId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_entityPostId_fkey" FOREIGN KEY ("entityPostId") REFERENCES "EntityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
