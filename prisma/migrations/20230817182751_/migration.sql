/*
  Warnings:

  - Added the required column `wordId` to the `UserGame` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "wordId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
