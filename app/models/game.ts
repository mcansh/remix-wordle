import { matchError, Result, TaggedError } from "better-result"
import { endOfDay, startOfDay } from "date-fns"

import { WORD_LENGTH } from "../constants"
import { db } from "../db"
import type { Game, User } from "../generated/prisma/client"
import { GameStatus, Prisma } from "../generated/prisma/client"
import type { ComputedGuess } from "../utils/game"
import {
	computeGuess,
	createEmptyLetter,
	getRandomWord,
	isValidWord,
	keyboardWithStatus,
	LetterState,
} from "../utils/game"

export class GameAlreadyCompleteError extends TaggedError("GameAlreadyCompleteError")<
	Record<never, never>
>() {}
export class InvalidWordLengthError extends TaggedError("InvalidWordLengthError")<{
	expected: number
	received: number
}>() {}
export class InvalidWordError extends TaggedError("InvalidWordError")<{ word: string }>() {}
export class DuplicateGuessError extends TaggedError("DuplicateGuessError")<{ word: string }>() {}
export class UnknownGuessError extends TaggedError("UnknownGuessError")<{ message: string }>() {}

export type CreateGuessError =
	| GameAlreadyCompleteError
	| InvalidWordLengthError
	| InvalidWordError
	| DuplicateGuessError
	| UnknownGuessError

let TOTAL_GUESSES = 6

let FULL_GAME_SELECT = {
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
		select: FULL_GAME_SELECT,
		data: {
			userId,
			word: getRandomWord(),
			status: GameStatus.EMPTY,
		},
	})

	return game
}

export async function createGuess(
	userId: User["id"],
	guessedWord: string,
): Promise<Result<void, CreateGuessError>> {
	let normalized = guessedWord.toLowerCase()
	let game = await getTodaysGame(userId)

	if (game.guesses.length >= TOTAL_GUESSES || isGameComplete(game.status)) {
		return Result.err(new GameAlreadyCompleteError({}))
	}

	if (normalized.length !== WORD_LENGTH) {
		return Result.err(
			new InvalidWordLengthError({ expected: WORD_LENGTH, received: normalized.length }),
		)
	}

	if (!isValidWord(normalized)) {
		return Result.err(new InvalidWordError({ word: normalized }))
	}

	return Result.tryPromise({
		try: async () => {
			let computedGuess = computeGuess(normalized, game.word)
			let won = computedGuess.every((l) => l.state === LetterState.Match)
			await db.game.update({
				where: { id: game.id },
				data: {
					guesses: { create: { guess: normalized } },
					status: won
						? GameStatus.WON
						: game.guesses.length + 1 >= TOTAL_GUESSES
							? GameStatus.COMPLETE
							: GameStatus.IN_PROGRESS,
				},
			})
		},
		catch: (error) => {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
				return new DuplicateGuessError({ word: normalized })
			}
			console.error(error)
			return new UnknownGuessError({
				message: getErrorMessage(error),
			})
		},
	})
}

export function getFailedToCreateGuessMessage(error: CreateGuessError): string {
	let message = matchError<CreateGuessError, string>(error, {
		GameAlreadyCompleteError: () => "Game is already complete",
		InvalidWordLengthError: () => `You must guess a word of length ${WORD_LENGTH}`,
		InvalidWordError: (e) => `${e.word.toUpperCase()} is not a valid word`,
		DuplicateGuessError: (e) => `You already guessed "${e.word.toUpperCase()}"`,
		UnknownGuessError: (e) => e.message,
	})

	return message
}

export function getErrorMessage(error: unknown, fallback = "An Unknown Error Occurred"): string {
	if (error instanceof Error) return error.message
	if (typeof error === "string") return error
	return fallback
}

export async function getGameById(id: Game["id"]): Promise<GameBoard> {
	let game = await db.game.findUnique({
		select: FULL_GAME_SELECT,
		where: { id },
	})

	if (!game) {
		throw new Response("Not found", { status: 404 })
	}

	return getFullBoard(game)
}

export function isGameComplete(status: GameStatus) {
	return ["WON", "COMPLETE"].includes(status)
}
