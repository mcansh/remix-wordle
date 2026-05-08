import { Result, TaggedError, UnhandledException } from "better-result"
import { endOfDay, startOfDay } from "date-fns"

import { WORD_LENGTH } from "#app/constants.ts"
import type { Game, User } from "#app/generated/prisma/client.ts"
import { GameStatus, Prisma } from "#app/generated/prisma/client.ts"
import { db } from "#app/utils/db.ts"
import type { ComputedGuess } from "#app/utils/game.ts"
import {
	computeGuess,
	createEmptyLetter,
	getRandomWord,
	isValidWord,
	keyboardWithStatus,
	LetterState,
} from "#app/utils/game.ts"

const TOTAL_GUESSES = 6

class GameAlreadyCompleteError extends TaggedError("GameAlreadyCompleteError")<{
	message: string
}>() {}

class GuessLengthError extends TaggedError("GuessLengthError")<{
	message: string
}>() {}

class InvalidWordError extends TaggedError("InvalidWordError")<{
	message: string
}>() {}

class DuplicateGuessError extends TaggedError("DuplicateGuessError")<{
	message: string
}>() {}

class CreateGuessFailedError extends TaggedError("CreateGuessFailedError")<{
	message: string
	cause?: unknown
}>() {}

class GameNotFoundError extends TaggedError("GameNotFoundError")<{
	message: string
	gameId: string
}>() {}

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

export type FullGame = Prisma.GameGetPayload<{ select: typeof FULL_GAME_SELECT }>

export function getTodayRange(now: Date) {
	let start = startOfDay(now)
	let end = endOfDay(now)
	return { start, end }
}

export async function getTodaysGame(userId: User["id"]): Promise<FullGame> {
	let now = new Date()
	let { start, end } = getTodayRange(now)

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
	let fillerGuesses = Array.from({
		length: fillerGuessesToMake,
	}).map((): { letters: Array<ComputedGuess> } => {
		return {
			letters: Array.from({ length: WORD_LENGTH }).map(() => {
				return createEmptyLetter()
			}),
		}
	})

	let computedGuesses: Array<{ letters: Array<ComputedGuess> }> = game.guesses.flatMap((guess) => {
		let computed = computeGuess(guess.guess, game.word)
		return {
			letters: computed,
		}
	})

	let guesses: Array<{ letters: Array<ComputedGuess> }> = [...computedGuesses, ...fillerGuesses]

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

export type CreateGuessError =
	| GameAlreadyCompleteError
	| GuessLengthError
	| InvalidWordError
	| DuplicateGuessError
	| CreateGuessFailedError
	| UnhandledException

export async function createGuess(
	userId: User["id"],
	guessedWord: string,
): Promise<Result<void, CreateGuessError>> {
	let game = await getTodaysGame(userId)

	if (game.guesses.length >= TOTAL_GUESSES || isGameComplete(game.status)) {
		return Result.err(new GameAlreadyCompleteError({ message: "Game is already complete" }))
	}

	if (guessedWord.length !== WORD_LENGTH) {
		return Result.err(
			new GuessLengthError({ message: `You must guess a word of length ${WORD_LENGTH}` }),
		)
	}

	if (!isValidWord(guessedWord)) {
		return Result.err(
			new InvalidWordError({ message: `${guessedWord.toUpperCase()} is not a valid word` }),
		)
	}

	let result = await Result.tryPromise({
		try: async () => {
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
			return
		},
		catch: (error) => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				return new DuplicateGuessError({
					message: `You already guessed "${guessedWord.toUpperCase()}"`,
				})
			}

			if (error instanceof Error) {
				return new CreateGuessFailedError({ message: error.message, cause: error })
			}

			return new UnhandledException({ cause: error })
		},
	})

	if (result.isErr()) {
		console.error(result.error)
	}

	return result
}

export function createGuessErrorMessage(error: CreateGuessError): string {
	if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
		return error.message
	}

	if (error instanceof UnhandledException) {
		return "An unknown error occurred"
	}

	return "An unknown error occurred"
}

export type GetGameByIdError = GameNotFoundError

export async function getGameById(id: Game["id"]): Promise<Result<GameBoard, GetGameByIdError>> {
	let game = await db.game.findUnique({
		select: FULL_GAME_SELECT,
		where: { id },
	})

	if (!game) {
		return Result.err(new GameNotFoundError({ message: "Game not found", gameId: id }))
	}

	return Result.ok(getFullBoard(game))
}

export function isGameComplete(status: GameStatus) {
	return ["WON", "COMPLETE"].includes(status)
}
