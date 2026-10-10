-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ENTITY_COMMENT_REPLY';

-- AlterTable
ALTER TABLE "ReviewComment" ADD COLUMN     "entityId" TEXT;

-- AlterTable
ALTER TABLE "ReviewReaction" ADD COLUMN     "entityId" TEXT;

-- CreateIndex
CREATE INDEX "ReviewComment_entityId_idx" ON "ReviewComment"("entityId");

-- CreateIndex
CREATE INDEX "ReviewReaction_entityId_idx" ON "ReviewReaction"("entityId");

-- AddForeignKey
ALTER TABLE "ReviewReaction" ADD CONSTRAINT "ReviewReaction_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
