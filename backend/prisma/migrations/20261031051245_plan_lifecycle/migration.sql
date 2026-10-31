-- AlterTable
ALTER TABLE "EntitySubscription" ADD COLUMN     "graceNoticeSentAt" TIMESTAMP(3),
ADD COLUMN     "renewalReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Offering" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;
