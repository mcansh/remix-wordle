import { endOfDay, startOfDay } from "date-fns"

import { WORD_LENGTH } from "../constants"
import type { Game, User } from "../generated/prisma/client"
import { GameStatus, Prisma } from "../generated/prisma/client"
import { db } from "../utils/db"
import type { ComputedGuess } from "../utils/game"
import {
	computeGuess,
	createEmptyLetter,
	getRandomWord,
	isValidWord,
	keyboardWithStatus,
	LetterState,
} from "../utils/game"

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
		data: {
			userId,
			word: getRandomWord(),
			status: GameStatus.EMPTY,
		},
		select: FULL_GAME_SELECT,
	})

	return game
}

export async function createGuess(userId: User["id"], guessedWord: string): Promise<string | null> {
	let game = await getTodaysGame(userId)

	if (game.guesses.length >= TOTAL_GUESSES || isGameComplete(game.status)) {
		return `Game is already complete`
	}

	if (guessedWord.length !== WORD_LENGTH) {
		return `You must guess a word of length ${WORD_LENGTH}`
	}

	if (!isValidWord(guessedWord)) {
		return `${guessedWord.toUpperCase()} is not a valid word`
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

		return null
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				return `You already guessed "${guessedWord.toUpperCase()}"`
			}
		}

		console.error(error)
		if (error instanceof Error) {
			return error.message
		}

		return String(error) || "An unknown error occurred"
	}
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
