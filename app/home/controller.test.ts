import { parse, parseSafe } from "remix/data-schema"
import { describe, expect, it, vi } from "vite-plus/test"

import { assertContains, loginAsCustomer, requestWithSession } from "../../test/helpers.ts"
import type { FullGame } from "../models/game.ts"
import { router } from "../router.ts"
import { guessWordSchema } from "./controller.tsx"

vi.mock("./models/game.ts", async (importActual) => {
	let actual = await importActual<typeof import("../models/game.ts")>()

	return {
		...actual,
		createGame: vi.fn().mockImplementation(async () => {
			return {
				id: "game-123",
				word: "apple",
				status: "IN_PROGRESS",
				createdAt: new Date(),
				updatedAt: new Date(),
				guesses: [],
			} satisfies FullGame
		}),
		getTodaysGame: vi.fn().mockImplementation(async () => {
			return {
				id: "game-123",
				word: "apple",
				status: "IN_PROGRESS",
				createdAt: new Date(),
				updatedAt: new Date(),
				guesses: [],
			} satisfies FullGame
		}),
	}
})

vi.mock("./models/user.ts", async (importActual) => {
	let actual = await importActual<typeof import("../models/user.ts")>()

	return {
		...actual,
		authenticateUser: vi.fn().mockImplementation(async (email: string, password: string) => {
			if (email === "customer@example.com" && password === "password123") {
				return {
					id: "user-123",
					email,
					username: "testuser",
					password: "hashed-password", // In real case, this would be hashed
				}
			}

			return null
		}),
		getUserById: vi.fn().mockImplementation(async (id: string) => {
			if (id === "user-123") {
				return {
					id: "user-123",
					email: "customer@example.com",
					username: "testuser",
					password: "hashed-password", // In real case, this would be hashed
				}
			}

			return null
		}),
	}
})

describe.skip("marketing handlers", () => {
	it("GET / returns home page", async () => {
		let sessionId = await loginAsCustomer(router)
		let request = requestWithSession("https://remix.run/", sessionId)
		let response = await router.fetch(request)

		expect(response.status).toBe(3)
		let html = await response.text()
		assertContains(html, "Remix Wordle")
		assertContains(html, "Submit Guess")
	})
})

describe("guessWord", () => {
	it("submits a valid guess", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")
		formData.append("letter", "x")

		let result = parse(guessWordSchema, formData)

		expect(result).toEqual({ letters: ["r", "e", "m", "i", "x"], cheat: false })
	})

	it("submits a cheat guess", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")
		formData.append("letter", "x")
		formData.append("cheat", "true")

		let result = parse(guessWordSchema, formData)

		expect(result).toEqual({ letters: ["r", "e", "m", "i", "x"], cheat: true })
	})

	it("fails to submit a guess with invalid letters", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")
		formData.append("letter", "x")
		formData.append("letter", "")

		let result = parseSafe(guessWordSchema, formData)

		expect(result).toEqual({ success: false, issues: expect.any(Array) })
	})

	it("fails to submit a guess with too many letters", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")
		formData.append("letter", "x")
		formData.append("letter", "y")

		let result = parseSafe(guessWordSchema, formData)

		expect(result).toEqual({ success: false, issues: expect.any(Array) })
	})

	it("fails to submit a guess with too few letters", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")

		let result = parseSafe(guessWordSchema, formData)

		expect(result).toEqual({ success: false, issues: expect.any(Array) })
	})

	it("fails to submit a guess with no form data", async () => {
		let formData = new FormData()

		let result = parseSafe(guessWordSchema, formData)

		expect(result).toEqual({ success: false, issues: expect.any(Array) })
	})
})
