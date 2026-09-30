/*
  Warnings:

  - You are about to drop the column `amenities` on the `Entity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Entity" DROP COLUMN "amenities";

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AmenityToEntity" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AmenityToEntity_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_key" ON "Amenity"("name");

-- CreateIndex
CREATE INDEX "_AmenityToEntity_B_index" ON "_AmenityToEntity"("B");

-- AddForeignKey
ALTER TABLE "_AmenityToEntity" ADD CONSTRAINT "_AmenityToEntity_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToEntity" ADD CONSTRAINT "_AmenityToEntity_B_fkey" FOREIGN KEY ("B") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
