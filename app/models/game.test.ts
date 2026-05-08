import { UnhandledException } from "better-result"
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { GameStatus, Prisma } from "#app/generated/prisma/client.ts"
import { assertErr, assertOk } from "#test/helpers.ts"

import { createGuess, createGuessErrorMessage, type FullGame, getGameById } from "./game"

const gameDb = vi.hoisted(() => ({
	findFirst: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	findUnique: vi.fn(),
}))

vi.mock("#app/utils/db.ts", () => ({
	db: {
		game: gameDb,
	},
}))

function buildGame(overrides: Partial<FullGame> = {}): FullGame {
	return {
		id: "game-1",
		createdAt: new Date("2026-05-08T00:00:00.000Z"),
		updatedAt: new Date("2026-05-08T00:00:00.000Z"),
		guesses: [],
		status: GameStatus.IN_PROGRESS,
		word: "apple",
		...overrides,
	}
}

describe("createGuess", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		gameDb.findFirst.mockResolvedValue(buildGame())
	})

	it("returns GuessLengthError for non-5-letter guesses", async () => {
		let result = await createGuess("user-1", "abc")

		assertErr(result)
		expect(result.error._tag).toBe("GuessLengthError")
		expect(createGuessErrorMessage(result.error)).toBe("You must guess a word of length 5")
		expect(gameDb.update).not.toHaveBeenCalled()
	})

	it("returns InvalidWordError for words not in dictionary", async () => {
		let result = await createGuess("user-1", "zzzzz")

		assertErr(result)
		expect(result.error._tag).toBe("InvalidWordError")
		expect(createGuessErrorMessage(result.error)).toBe("ZZZZZ is not a valid word")
		expect(gameDb.update).not.toHaveBeenCalled()
	})

	it("maps Prisma P2002 to DuplicateGuessError", async () => {
		let prismaError = new Prisma.PrismaClientKnownRequestError("duplicate", {
			code: "P2002",
			clientVersion: "test",
		})
		gameDb.update.mockRejectedValue(prismaError)
		let consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

		let result = await createGuess("user-1", "apple")

		assertErr(result)
		expect(result.error._tag).toBe("DuplicateGuessError")
		expect(createGuessErrorMessage(result.error)).toBe('You already guessed "APPLE"')
		expect(consoleError).toHaveBeenCalled()
	})

	it("maps generic errors to CreateGuessFailedError", async () => {
		gameDb.update.mockRejectedValue(new Error("database unavailable"))
		let consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)

		let result = await createGuess("user-1", "apple")

		assertErr(result)
		expect(result.error._tag).toBe("CreateGuessFailedError")
		expect(createGuessErrorMessage(result.error)).toBe("database unavailable")
		expect(consoleError).toHaveBeenCalled()
	})

	it("returns GameAlreadyCompleteError when the game is complete", async () => {
		gameDb.findFirst.mockResolvedValue(buildGame({ status: GameStatus.COMPLETE }))

		let result = await createGuess("user-1", "apple")

		assertErr(result)
		expect(result.error._tag).toBe("GameAlreadyCompleteError")
		expect(createGuessErrorMessage(result.error)).toBe("Game is already complete")
		expect(gameDb.update).not.toHaveBeenCalled()
	})

	it("returns ok and marks game won when guess matches word", async () => {
		gameDb.findFirst.mockResolvedValue(buildGame({ word: "apple", guesses: [] }))
		gameDb.update.mockResolvedValue(undefined)

		let result = await createGuess("user-1", "apple")

		assertOk(result)
		expect(gameDb.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: GameStatus.WON }),
			}),
		)
	})

	it("returns ok and marks game in progress for non-final miss", async () => {
		gameDb.findFirst.mockResolvedValue(buildGame({ word: "apple", guesses: [{ guess: "baker" }] }))
		gameDb.update.mockResolvedValue(undefined)

		let result = await createGuess("user-1", "candy")

		assertOk(result)
		expect(gameDb.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: GameStatus.IN_PROGRESS }),
			}),
		)
	})

	it("returns ok and marks game complete on final non-winning guess", async () => {
		gameDb.findFirst.mockResolvedValue(
			buildGame({
				word: "apple",
				guesses: [
					{ guess: "baker" },
					{ guess: "candy" },
					{ guess: "delta" },
					{ guess: "eagle" },
					{ guess: "fable" },
				],
			}),
		)
		gameDb.update.mockResolvedValue(undefined)

		let result = await createGuess("user-1", "grape")

		assertOk(result)
		expect(gameDb.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ status: GameStatus.COMPLETE }),
			}),
		)
	})
})

describe("getGameById", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns GameNotFoundError when game does not exist", async () => {
		gameDb.findUnique.mockResolvedValue(null)

		let result = await getGameById("missing-game")

		assertErr(result)
		expect(result.error._tag).toBe("GameNotFoundError")
		expect(result.error.message).toBe("Game not found")
		expect(result.error.gameId).toBe("missing-game")
	})

	it("returns board when game exists", async () => {
		gameDb.findUnique.mockResolvedValue(
			buildGame({
				guesses: [{ guess: "apple" }, { guess: "baker" }],
				status: GameStatus.IN_PROGRESS,
				word: "apple",
			}),
		)

		let result = await getGameById("game-1")

		assertOk(result)
		expect(result.value.id).toBe("game-1")
		expect(result.value.currentGuess).toBe(2)
		expect(result.value.guesses).toHaveLength(6)
		expect(result.value.guesses[0]?.letters).toHaveLength(5)
	})
})

describe("createGuessErrorMessage", () => {
	it("returns unknown error fallback for UnhandledException", () => {
		let error = new UnhandledException({ cause: "boom" })
		expect(createGuessErrorMessage(error)).toContain("Unhandled exception")
	})
})
