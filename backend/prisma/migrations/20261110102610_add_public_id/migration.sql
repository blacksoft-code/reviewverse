/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Entity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "publicId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "publicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Entity_publicId_key" ON "Entity"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");
