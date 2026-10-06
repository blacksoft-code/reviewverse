/*
  Warnings:

  - You are about to drop the column `worksAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "worksAt",
ADD COLUMN     "worksAtEntityId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_worksAtEntityId_fkey" FOREIGN KEY ("worksAtEntityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
