-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('USER_PROFILE', 'USER_COVER', 'ENTITY_LOGO', 'ENTITY_COVER', 'REVIEW', 'ENTITY_POST');

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "userId" TEXT,
    "entityId" TEXT,
    "reviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_userId_idx" ON "Media"("userId");

-- CreateIndex
CREATE INDEX "Media_entityId_idx" ON "Media"("entityId");

-- CreateIndex
CREATE INDEX "Media_reviewId_idx" ON "Media"("reviewId");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
