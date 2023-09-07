/*
  Warnings:

  - The values [EMPTY] on the enum `GameStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Game` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameStatus_new" AS ENUM ('IN_PROGRESS', 'COMPLETE', 'WON');
ALTER TABLE "Game" ALTER COLUMN "status" TYPE "GameStatus_new" USING ("status"::text::"GameStatus_new");
ALTER TYPE "GameStatus" RENAME TO "GameStatus_old";
ALTER TYPE "GameStatus_new" RENAME TO "GameStatus";
DROP TYPE "GameStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_userId_fkey";

-- DropForeignKey
ALTER TABLE "Guess" DROP CONSTRAINT "Guess_gameId_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "UserGame" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserGame_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "UserGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
