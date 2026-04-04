import { describe, expect, it } from "vite-plus/test"

import { getPostAuthRedirect, getReturnToQuery } from "./auth.ts"

describe("getReturnToQuery", () => {
	it("returns an object with returnTo for a valid relative path", () => {
		let url = new URL("https://example.com/login?returnTo=/dashboard")
		expect(getReturnToQuery(url)).toEqual({ returnTo: "/dashboard" })
	})

	it("returns an empty object when there is no returnTo param", () => {
		let url = new URL("https://example.com/login")
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns an empty object when returnTo is empty string", () => {
		let url = new URL("https://example.com/login?returnTo=")
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns an empty object for a protocol-relative URL (//evil.com)", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("//evil.com"))
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns an empty object for an absolute http URL", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("http://evil.com"))
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns an empty object for an absolute https URL", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("https://evil.com/steal"),
		)
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns an empty object for a path not starting with /", () => {
		let url = new URL("https://example.com/login?returnTo=relative-path")
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("preserves query strings in the returnTo path", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("/search?q=wordle"),
		)
		expect(getReturnToQuery(url)).toEqual({ returnTo: "/search?q=wordle" })
	})

	it("preserves hash fragments in the returnTo path", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("/page#section"))
		expect(getReturnToQuery(url)).toEqual({ returnTo: "/page#section" })
	})

	it("returns an empty object for a javascript: URI", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("javascript:alert(1)"),
		)
		expect(getReturnToQuery(url)).toEqual({})
	})

	it("returns returnTo for a nested path", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("/history/game-123"),
		)
		expect(getReturnToQuery(url)).toEqual({ returnTo: "/history/game-123" })
	})
})

describe("getPostAuthRedirect", () => {
	it("returns a safe returnTo path when present", () => {
		let url = new URL("https://example.com/login?returnTo=/dashboard")
		expect(getPostAuthRedirect(url)).toBe("/dashboard")
	})

	it("falls back to home when there is no returnTo param", () => {
		let url = new URL("https://example.com/login")
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("falls back to home when returnTo is empty string", () => {
		let url = new URL("https://example.com/login?returnTo=")
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("falls back to home for a protocol-relative URL", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("//evil.com"))
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("falls back to home for an absolute http URL", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("http://malicious.com"),
		)
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("falls back to home for a path not starting with /", () => {
		let url = new URL("https://example.com/login?returnTo=relative")
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("uses a custom fallback when returnTo is absent", () => {
		let url = new URL("https://example.com/login")
		expect(getPostAuthRedirect(url, "/custom-page")).toBe("/custom-page")
	})

	it("uses a custom fallback when returnTo is unsafe", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("//evil.com"))
		expect(getPostAuthRedirect(url, "/safe-fallback")).toBe("/safe-fallback")
	})

	it("prefers returnTo over the custom fallback when safe", () => {
		let url = new URL("https://example.com/login?returnTo=/history")
		expect(getPostAuthRedirect(url, "/custom-page")).toBe("/history")
	})

	it("returns the correct path for the root returnTo", () => {
		let url = new URL("https://example.com/login?returnTo=" + encodeURIComponent("/"))
		expect(getPostAuthRedirect(url)).toBe("/")
	})

	it("rejects a javascript: returnTo and falls back to home", () => {
		let url = new URL(
			"https://example.com/login?returnTo=" + encodeURIComponent("javascript:alert(1)"),
		)
		expect(getPostAuthRedirect(url)).toBe("/")
	})
})
