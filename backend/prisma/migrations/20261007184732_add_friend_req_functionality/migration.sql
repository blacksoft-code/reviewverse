-- CreateEnum
CREATE TYPE "FriendListVisibility" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "friendListVisibility" "FriendListVisibility" NOT NULL DEFAULT 'PUBLIC';
