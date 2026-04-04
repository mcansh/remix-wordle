import { describe, expect, it } from "vite-plus/test"

import { normalizeEmail, parseAuthSession } from "./auth-session.ts"

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
		expect(parseAuthSession({ userId: "user-123" })).toEqual({ userId: "user-123" })
	})

	it("returns null for null input", () => {
		expect(parseAuthSession(null)).toBeNull()
	})

	it("returns null for undefined input", () => {
		expect(parseAuthSession(undefined)).toBeNull()
	})

	it("returns null for an empty object", () => {
		expect(parseAuthSession({})).toBeNull()
	})

	it("returns null when userId is a number", () => {
		expect(parseAuthSession({ userId: 123 })).toBeNull()
	})

	it("returns null when userId is missing", () => {
		expect(parseAuthSession({ other: "value" })).toBeNull()
	})

	it("returns null for a string input", () => {
		expect(parseAuthSession("user-123")).toBeNull()
	})

	it("returns null for an array input", () => {
		expect(parseAuthSession(["user-123"])).toBeNull()
	})

	it("returns null for a boolean input", () => {
		expect(parseAuthSession(true)).toBeNull()
	})

	it("returns null for a number input", () => {
		expect(parseAuthSession(42)).toBeNull()
	})

	it("returns an AuthSession with extra fields stripped", () => {
		// Extra keys beyond userId are irrelevant; only userId matters
		let result = parseAuthSession({ userId: "abc", extra: "ignored" })
		expect(result).toEqual({ userId: "abc" })
	})

	it("returns null when userId is null", () => {
		expect(parseAuthSession({ userId: null })).toBeNull()
	})

	it("returns null when userId is an empty object", () => {
		expect(parseAuthSession({ userId: {} })).toBeNull()
	})

	it("preserves the exact userId string value", () => {
		let result = parseAuthSession({ userId: "a-very-specific-uuid-value" })
		expect(result?.userId).toBe("a-very-specific-uuid-value")
	})
})
