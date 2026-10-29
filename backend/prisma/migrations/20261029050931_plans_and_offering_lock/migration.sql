-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PRO');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('ADMIN', 'PAYMENT');

-- CreateEnum
CREATE TYPE "BadgeOverride" AS ENUM ('AUTO', 'FORCE_ON', 'FORCE_OFF');

-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "badgeOverride" "BadgeOverride" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "EntitySubscription" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "nextPlan" "PlanTier",
    "nextBillingCycle" "BillingCycle",
    "source" "SubscriptionSource" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntitySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntitySubscription_entityId_key" ON "EntitySubscription"("entityId");

-- CreateIndex
CREATE INDEX "EntitySubscription_endsAt_idx" ON "EntitySubscription"("endsAt");

-- CreateIndex
CREATE INDEX "Offering_entityId_isPublic_idx" ON "Offering"("entityId", "isPublic");

-- AddForeignKey
ALTER TABLE "EntitySubscription" ADD CONSTRAINT "EntitySubscription_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
