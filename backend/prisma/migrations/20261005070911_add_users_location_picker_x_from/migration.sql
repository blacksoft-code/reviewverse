/*
  Warnings:

  - You are about to drop the column `from` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `livesIn` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "from",
DROP COLUMN "livesIn",
ADD COLUMN     "fromLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
