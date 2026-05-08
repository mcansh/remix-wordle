import type { Err, Ok, Result } from "better-result"
import { describe, expect, it } from "vite-plus/test"

import { normalizeEmail, parseAuthSession } from "./auth-session.ts"

/**
 * Asserts that a Result is Ok
 * @param {Result<T, E>} result - The result to check
 */
function assertOk<T, E>(result: Result<T, E>): asserts result is Ok<T, E> {
	if (result.isErr()) {
		throw new Error(`Expected ok result, received error`)
	}
}

/**
 * Asserts that a Result is Err
 * @param {Result<T, E>} result - The result to check
 */
function assertErr<T, E>(result: Result<T, E>): asserts result is Err<T, E> {
	if (result.isOk()) {
		throw new Error("Expected an error result, received ok")
	}
}

describe("normalizeEmail", () => {
	it("lowercases an already-lowercase email", () => {
		expect(normalizeEmail("user@example.com")).toBe("user@example.com")
	})

	it("lowercases an uppercase email", () => {
		expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com")
	})

	it("lowercases a mixed-case email", () => {
		expect(normalizeEmail("User@Example.Com")).toBe("user@example.com")
	})

	it("trims leading whitespace", () => {
		expect(normalizeEmail("  user@example.com")).toBe("user@example.com")
	})

	it("trims trailing whitespace", () => {
		expect(normalizeEmail("user@example.com  ")).toBe("user@example.com")
	})

	it("trims both leading and trailing whitespace", () => {
		expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com")
	})

	it("trims whitespace and lowercases together", () => {
		expect(normalizeEmail("  ADMIN@SITE.ORG  ")).toBe("admin@site.org")
	})

	it("returns empty string for empty string input", () => {
		expect(normalizeEmail("")).toBe("")
	})

	it("handles email with only whitespace", () => {
		expect(normalizeEmail("   ")).toBe("")
	})
})

describe("parseAuthSession", () => {
	it("returns an AuthSession for a valid object with userId string", () => {
		let result = parseAuthSession({ userId: "user-123" })
		assertOk(result)
		expect(result.value).toEqual({ userId: "user-123" })
	})

	it("returns an error for null input", () => {
		assertErr(parseAuthSession(null))
	})

	it("returns an error for undefined input", () => {
		assertErr(parseAuthSession(undefined))
	})

	it("returns an error for an empty object", () => {
		assertErr(parseAuthSession({}))
	})

	it("returns an error when userId is a number", () => {
		assertErr(parseAuthSession({ userId: 123 }))
	})

	it("returns an error when userId is missing", () => {
		assertErr(parseAuthSession({ other: "value" }))
	})

	it("returns an error for a string input", () => {
		assertErr(parseAuthSession("user-123"))
	})

	it("returns an error for an array input", () => {
		assertErr(parseAuthSession(["user-123"]))
	})

	it("returns an error for a boolean input", () => {
		assertErr(parseAuthSession(true))
	})

	it("returns an error for a number input", () => {
		assertErr(parseAuthSession(42))
	})

	it("returns an AuthSession with extra fields stripped", () => {
		// Extra keys beyond userId are irrelevant; only userId matters
		let result = parseAuthSession({ userId: "abc", extra: "ignored" })
		assertOk(result)
		expect(result.value).toEqual({ userId: "abc" })
	})

	it("returns an error when userId is null", () => {
		assertErr(parseAuthSession({ userId: null }))
	})

	it("returns an error when userId is an empty object", () => {
		assertErr(parseAuthSession({ userId: {} }))
	})

	it("preserves the exact userId string value", () => {
		let result = parseAuthSession({ userId: "a-very-specific-uuid-value" })
		assertOk(result)
		expect(result.value.userId).toBe("a-very-specific-uuid-value")
	})
})
