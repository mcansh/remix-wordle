import { Temporal } from "temporal-polyfill";

import type { Game, User } from "../generated/prisma/client";
import type { ComputedGuess } from "../utils/game";

import { WORD_LENGTH } from "../constants";
import { db } from "../db";
import { GameStatus, Prisma } from "../generated/prisma/client";
import { gameQueue } from "../queue";
import {
  computeGuess,
  createEmptyLetter,
  getRandomWord,
  isValidWord,
  keyboardWithStatus,
  LetterState,
} from "../utils/game";

const TOTAL_GUESSES = 6;

const FULL_GAME_OPTIONS = {
  id: true,
  createdAt: true,
  updatedAt: true,
  guesses: {
    orderBy: { createdAt: "asc" },
    select: { guess: true },
  },
  status: true,
  word: true,
} satisfies Prisma.GameSelect;

export type FullGame = Prisma.GameGetPayload<{ select: typeof FULL_GAME_OPTIONS }>;

export async function getTodaysGame(userId: User["id"]): Promise<FullGame> {
  const todayTemporal = Temporal.Now.plainDateISO();
  const start = todayTemporal.toPlainDateTime({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const end = todayTemporal.toPlainDateTime({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const startDate = new Date(start.millisecond);
  const endDate = new Date(end.millisecond);

  let game = await db.game.findFirst({
    select: FULL_GAME_OPTIONS,
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return game ?? (await createGame(userId));
}

export type GameBoard = ReturnType<typeof getFullBoard>;

type GuessData = {
  letters: Array<ComputedGuess>;
};

export function getFullBoard(game: FullGame) {
  const fillerGuessesToMake = TOTAL_GUESSES - game.guesses.length;

  const fillerGuesses = Array.from({
    length: fillerGuessesToMake,
  }).map<GuessData>(() => {
    return {
      letters: Array.from({ length: WORD_LENGTH }).map(() => {
        return createEmptyLetter();
      }),
    };
  });

  const computedGuesses = game.guesses.flatMap<GuessData>((guess) => {
    const computed = computeGuess(guess.guess, game.word);
    return {
      letters: computed,
    };
  });

  const guesses = [...computedGuesses, ...fillerGuesses] satisfies Array<GuessData>;

  const currentGuess = game.guesses.length;

  return {
    currentGuess,
    ...game,
    guesses,
    keyboardWithStatus: keyboardWithStatus(guesses),
  };
}

export async function createGame(userId: User["id"]): Promise<FullGame> {
  const game = await db.game.create({
    data: {
      userId,
      word: getRandomWord(),
      status: GameStatus.EMPTY,
    },
    select: FULL_GAME_OPTIONS,
  });

  const now = Temporal.Now.plainDateTimeISO();
  const endOfDayTemporal = now.with({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const timeUntilEndOfDay = Temporal.Duration.from({
    hours: endOfDayTemporal.hour - now.hour,
    minutes: endOfDayTemporal.minute - now.minute,
    seconds: endOfDayTemporal.second - now.second,
    milliseconds: endOfDayTemporal.millisecond - now.millisecond,
  }).total("milliseconds");

  gameQueue.add(game.id, { gameId: game.id }, { delay: timeUntilEndOfDay });

  return game;
}

export async function createGuess(userId: User["id"], guessedWord: string): Promise<string | null> {
  const normalized = guessedWord.toLowerCase();
  const game = await getTodaysGame(userId);

  if (game.guesses.length >= TOTAL_GUESSES || isGameComplete(game.status)) {
    return `Game is already complete`;
  }

  if (normalized.length !== WORD_LENGTH) {
    return `You must guess a word of length ${WORD_LENGTH}`;
  }

  if (!isValidWord(normalized)) {
    return `${normalized.toUpperCase()} is not a valid word`;
  }

  try {
    const computedGuess = computeGuess(normalized, game.word);
    const won = computedGuess.every((l) => l.state === LetterState.Match);
    const updatedGame = await db.game.update({
      where: { id: game.id },
      data: {
        guesses: { create: { guess: normalized } },
        status: won
          ? GameStatus.WON
          : game.guesses.length + 1 >= TOTAL_GUESSES
            ? GameStatus.COMPLETE
            : GameStatus.IN_PROGRESS,
      },
    });

    if (updatedGame.status === GameStatus.COMPLETE) {
      console.log(`Game ${game.id} is complete, removing from queue`);
      gameQueue.remove(game.id);
    }

    return null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return `You already guessed "${normalized.toUpperCase()}"`;
      }
    }

    console.error(error);
    if (error instanceof Error) {
      return error.message;
    }

    return String(error) || "An unknown error occurred";
  }
}

export async function getGameById(id: Game["id"]): Promise<ReturnType<typeof getFullBoard> | null> {
  const game = await db.game.findUnique({
    select: FULL_GAME_OPTIONS,
    where: { id },
  });

  if (!game) return null;

  return getFullBoard(game);
}

export function isGameComplete(status: GameStatus) {
  return ["WON", "COMPLETE"].includes(status);
}
