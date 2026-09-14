-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "from" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "livesIn" TEXT,
ADD COLUMN     "studiesAt" TEXT,
ADD COLUMN     "worksAt" TEXT;
