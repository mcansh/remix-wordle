import { GameStatus, Guess, Prisma, User } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { WORD_LENGTH } from "~/constants";
import { db } from "~/db.server";
import {
  ComputedGuess,
  computeGuess,
  createEmptyLetter,
  getRandomWord,
  isValidWord,
  LetterState,
} from "~/utils/game";

let TOTAL_GUESSES = 6;

let FULL_GAME_OPTIONS = Prisma.validator<Prisma.GameArgs>()({
  select: {
    id: true,
    word: true,
    status: true,
    guesses: {
      orderBy: {
        createdAt: "asc",
      },
      select: {
        guess: true,
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

export function getFullBoard(game: FullGame) {
  let fillerGuessesToMake = TOTAL_GUESSES - game.guesses.length;
  let fillerGuesses = Array.from({
    length: fillerGuessesToMake,
  }).map((): { letters: Array<ComputedGuess> } => {
    return {
      letters: Array.from({ length: WORD_LENGTH }).map(() => {
        return createEmptyLetter();
      }),
    };
  });

  let computedGuesses: Array<{ letters: Array<ComputedGuess> }> =
    game.guesses.flatMap((guess) => {
      let computed = computeGuess(guess.guess, game.word);
      return {
        letters: computed,
      };
    });

  let guesses: Array<{ letters: Array<ComputedGuess> }> = [
    ...computedGuesses,
    ...fillerGuesses,
  ];
  let currentGuess = game.guesses.length;

  return {
    currentGuess,
    ...game,
    guesses,
  };
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

export async function createGuess(
  userId: User["id"],
  guessedWord: string
): Promise<[Guess, null] | [null, string]> {
  let game = await getTodaysGame(userId);

  let gameOver = game.guesses.length > TOTAL_GUESSES;
  let computedGuess = computeGuess(guessedWord, game.word);
  let won = computedGuess.every((letter) => letter.state === LetterState.Match);

  if (guessedWord.length !== WORD_LENGTH) {
    return [null, "You must guess a word of length " + WORD_LENGTH];
  }

  if (!isValidWord(guessedWord)) {
    return [null, `${guessedWord} is not a valid word`];
  }

  let guesses = await db.guess.findMany({
    where: { gameId: game.id },
    select: { guess: true },
  });

  if (guesses.some((guess) => guess.guess === guessedWord)) {
    return [null, `You already guessed ${guessedWord}`];
  }

  let guess = await db.$transaction(async (trx) => {
    let newGuess = await trx.guess.create({
      data: {
        gameId: game.id,
        guess: guessedWord,
      },
    });

    await trx.game.update({
      where: { id: game.id },
      data: {
        status: won
          ? GameStatus.WON
          : gameOver
          ? GameStatus.COMPLETE
          : GameStatus.IN_PROGRESS,
      },
    });

    return newGuess;
  });

  return [guess, null];
}
