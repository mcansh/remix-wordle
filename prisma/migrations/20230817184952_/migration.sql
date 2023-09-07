-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_wordId_fkey";

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
