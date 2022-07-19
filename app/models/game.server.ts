import { GameStatus, Prisma, User } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { db } from "~/db.server";
import { computeGuess, getRandomWord } from "~/utils";

let TOTAL_GUESSES = 6;

let FULL_GAME_OPTIONS = Prisma.validator<Prisma.GameArgs>()({
  select: {
    id: true,
    word: true,
    status: true,
    guesses: {
      select: {
        letters: {
          select: {
            letter: true,
            state: true,
            id: true,
          },
        },
      },
    },
  },
});

export type FullGame = Prisma.GameGetPayload<typeof FULL_GAME_OPTIONS>;

export async function getTodaysGame(userId: User["id"]): Promise<FullGame> {
  let now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  let game = await db.game.findFirst({
    ...FULL_GAME_OPTIONS,
    where: {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  if (!game) {
    game = await createGame(userId);
  }

  return game;
}

export async function createGame(userId: User["id"]): Promise<FullGame> {
  return db.game.create({
    data: {
      userId,
      word: getRandomWord(),
      status: GameStatus.EMPTY,
    },
    ...FULL_GAME_OPTIONS,
  });
}

export async function createGuess(userId: User["id"], guess: string) {
  let game = await getTodaysGame(userId);

  let gameOver = game.guesses.length > TOTAL_GUESSES;
  let computedGuess = computeGuess(guess, game.word);
  let won = computedGuess.every((letter) => letter.state === "Match");

  return await db.$transaction(async (trx) => {
    let newGuess = await trx.guess.create({
      data: {
        gameId: game.id,
        letters: {
          createMany: {
            data: computedGuess,
          },
        },
      },
    });

    await trx.game.update({
      where: { id: game.id },
      data: {
        status: gameOver
          ? GameStatus.COMPLETE
          : won
          ? GameStatus.WON
          : GameStatus.IN_PROGRESS,
      },
    });

    return newGuess;
  });
}
