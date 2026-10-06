-- AlterTable
ALTER TABLE "User" ADD COLUMN     "livesInLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_livesInLocationId_fkey" FOREIGN KEY ("livesInLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
