import { expect } from "remix/assert"
import { parse, parseSafe } from "remix/data-schema"
import { describe, it } from "remix/test"

import { router } from "#app/router.ts"
import { assertContains, loginAsCustomer, requestWithSession } from "#test/helpers.ts"

import { guessWordSchema } from "./controller.tsx"

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

		expect(result.success).toBe(false)
		if (result.success === false) {
			expect(Array.isArray(result.issues)).toBe(true)
		}
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

		expect(result.success).toBe(false)
		if (result.success === false) {
			expect(Array.isArray(result.issues)).toBe(true)
		}
	})

	it("fails to submit a guess with too few letters", async () => {
		let formData = new FormData()
		formData.append("letter", "r")
		formData.append("letter", "e")
		formData.append("letter", "m")
		formData.append("letter", "i")

		let result = parseSafe(guessWordSchema, formData)

		expect(result.success).toBe(false)
		if (result.success === false) {
			expect(Array.isArray(result.issues)).toBe(true)
		}
	})

	it("fails to submit a guess with no form data", async () => {
		let formData = new FormData()

		let result = parseSafe(guessWordSchema, formData)

		expect(result.success).toBe(false)
		if (result.success === false) {
			expect(Array.isArray(result.issues)).toBe(true)
		}
	})
})
