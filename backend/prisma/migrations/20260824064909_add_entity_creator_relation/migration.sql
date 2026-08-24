/*
  Warnings:

  - You are about to drop the column `email` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Entity` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Entity" DROP CONSTRAINT "Entity_userId_fkey";

-- AlterTable
ALTER TABLE "Entity" DROP COLUMN "email",
DROP COLUMN "location",
DROP COLUMN "phone",
DROP COLUMN "userId",
DROP COLUMN "website",
ADD COLUMN     "createdById" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
