import { Result } from "better-result"
import { endOfDay, startOfDay } from "date-fns"

import { TOTAL_GUESSES, WORD_LENGTH } from "../constants.ts"
import type { Game, User } from "../generated/prisma/client.ts"
import { GameStatus, Prisma } from "../generated/prisma/client.ts"
import { db } from "../utils/db.ts"
import type { ComputedGuess, GuessError } from "../utils/game.ts"
import {
	computeGuess,
	createEmptyLetter,
	duplicateGuessError,
	gameCompleteError,
	getRandomWord,
	invalidWordError,
	isValidWord,
	keyboardWithStatus,
	LetterState,
	wrongLengthError,
	unknownGameError,
} from "../utils/game.ts"

const FULL_GAME_SELECT = {
	id: true,
	createdAt: true,
	updatedAt: true,
	guesses: {
		orderBy: { createdAt: "asc" },
		select: { guess: true },
	},
	status: true,
	word: true,
} satisfies Prisma.GameSelect

export type FullGame = Prisma.GameGetPayload<{
	select: typeof FULL_GAME_SELECT
}>

export async function getTodaysGame(userId: User["id"]): Promise<FullGame> {
	let now = new Date()
	let start = startOfDay(now)
	let end = endOfDay(now)

	let game = await db.game.findFirst({
		select: FULL_GAME_SELECT,
		where: {
			userId,
			createdAt: {
				gte: start,
				lte: end,
			},
		},
	})

	if (!game) {
		game = await createGame(userId)
	}

	return game
}

export type GameBoard = ReturnType<typeof getFullBoard>

export function getFullBoard(game: FullGame) {
	let fillerGuessesToMake = TOTAL_GUESSES - game.guesses.length
	let fillerGuesses = Array.from({ length: fillerGuessesToMake }, () => {
		return {
			letters: Array.from({ length: WORD_LENGTH }, () => {
				return createEmptyLetter()
			}),
		}
	})

	let computedGuesses: Array<{ letters: Array<ComputedGuess> }> =
		game.guesses.flatMap((guess) => {
			let computed = computeGuess(guess.guess, game.word)
			return {
				letters: computed,
			}
		})

	let guesses: Array<{ letters: Array<ComputedGuess> }> = [
		...computedGuesses,
		...fillerGuesses,
	]

	let currentGuess = game.guesses.length

	return {
		currentGuess,
		...game,
		guesses,
		keyboardWithStatus: keyboardWithStatus(guesses),
	}
}

export async function createGame(userId: User["id"]): Promise<FullGame> {
	let game = await db.game.create({
		data: {
			userId,
			word: getRandomWord(),
			status: GameStatus.EMPTY,
		},
		select: FULL_GAME_SELECT,
	})

	return game
}

export async function submitTurn(
	userId: User["id"],
	guessedWord: string,
): Promise<Result<void, GuessError>> {
	let game = await getTodaysGame(userId)

	if (game.guesses.length >= TOTAL_GUESSES || isGameComplete(game.status)) {
		return Result.err(gameCompleteError())
	}

	if (guessedWord.length !== WORD_LENGTH) {
		return Result.err(wrongLengthError(WORD_LENGTH))
	}

	if (!isValidWord(guessedWord)) {
		return Result.err(invalidWordError(guessedWord))
	}

	try {
		let computedGuess = computeGuess(guessedWord, game.word)
		let won = computedGuess.every((l) => l.state === LetterState.Match)
		await db.game.update({
			where: { id: game.id },
			data: {
				guesses: { create: { guess: guessedWord } },
				status: won
					? GameStatus.WON
					: game.guesses.length + 1 >= TOTAL_GUESSES
						? GameStatus.COMPLETE
						: GameStatus.IN_PROGRESS,
			},
		})

		return Result.ok(undefined)
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				return Result.err(duplicateGuessError(guessedWord))
			}
		}

		console.error(error)
		if (error instanceof Error) {
			return Result.err(unknownGameError(error.message))
		}

		return Result.err(
			unknownGameError(String(error) || "An unknown error occurred"),
		)
	}
}

export async function getGameById(id: Game["id"]): Promise<GameBoard | null> {
	let game = await db.game.findUnique({
		select: FULL_GAME_SELECT,
		where: { id },
	})

	if (!game) {
		return null
	}

	return getFullBoard(game)
}

export function isGameComplete(status: GameStatus) {
	return ["WON", "COMPLETE"].includes(status)
}
