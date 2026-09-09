-- CreateEnum
CREATE TYPE "EntityCreationType" AS ENUM ('OWNER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "EntityRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "EntityClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EntityMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" "EntityRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityClaim" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EntityClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityMembership_userId_idx" ON "EntityMembership"("userId");

-- CreateIndex
CREATE INDEX "EntityMembership_entityId_idx" ON "EntityMembership"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMembership_userId_entityId_key" ON "EntityMembership"("userId", "entityId");

-- CreateIndex
CREATE INDEX "EntityClaim_entityId_idx" ON "EntityClaim"("entityId");

-- CreateIndex
CREATE INDEX "EntityClaim_userId_idx" ON "EntityClaim"("userId");

-- CreateIndex
CREATE INDEX "EntityClaim_status_idx" ON "EntityClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EntityClaim_userId_entityId_key" ON "EntityClaim"("userId", "entityId");

-- AddForeignKey
ALTER TABLE "EntityMembership" ADD CONSTRAINT "EntityMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembership" ADD CONSTRAINT "EntityMembership_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityClaim" ADD CONSTRAINT "EntityClaim_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityClaim" ADD CONSTRAINT "EntityClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
