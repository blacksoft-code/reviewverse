-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SHARE_REACTION';
ALTER TYPE "NotificationType" ADD VALUE 'SHARE_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE 'SHARE_REPLY';

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewId" TEXT,
    "entityPostId" TEXT,
    "caption" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareReaction" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Share_userId_createdAt_idx" ON "Share"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Share_reviewId_idx" ON "Share"("reviewId");

-- CreateIndex
CREATE INDEX "Share_entityPostId_idx" ON "Share"("entityPostId");

-- CreateIndex
CREATE INDEX "ShareReaction_shareId_idx" ON "ShareReaction"("shareId");

-- CreateIndex
CREATE INDEX "ShareReaction_userId_idx" ON "ShareReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareReaction_userId_shareId_key" ON "ShareReaction"("userId", "shareId");

-- CreateIndex
CREATE INDEX "ShareComment_shareId_idx" ON "ShareComment"("shareId");

-- CreateIndex
CREATE INDEX "ShareComment_parentId_idx" ON "ShareComment"("parentId");

-- CreateIndex
CREATE INDEX "ShareComment_userId_idx" ON "ShareComment"("userId");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_entityPostId_fkey" FOREIGN KEY ("entityPostId") REFERENCES "EntityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareReaction" ADD CONSTRAINT "ShareReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareReaction" ADD CONSTRAINT "ShareReaction_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareComment" ADD CONSTRAINT "ShareComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ShareComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
