/*
  Warnings:

  - You are about to drop the column `status` on the `Game` table. All the data in the column will be lost.
  - Added the required column `status` to the `UserGame` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "status" "GameStatus" NOT NULL;
