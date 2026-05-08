import type { Session } from "remix/session"
import { describe, expect, it, vi } from "vite-plus/test"

import { flashLoginRequestError, flashRegisterError, flashResetPasswordError } from "./flash"

function makeSession() {
	let flash = vi.fn()
	let session = { flash } as unknown as Session
	return { session, flash }
}

describe("flashLoginRequestError", () => {
	it("flashes generic sign-in error and redirects to login", () => {
		let { session, flash } = makeSession()
		let url = new URL("https://example.com/login")

		let response = flashLoginRequestError(session, url)

		expect(flash).toHaveBeenCalledWith("error", "We could not complete that sign-in request.")
		expect(response.status).toBe(302)
		expect(response.headers.get("Location")).toBe("/login")
	})

	it("preserves safe returnTo query on redirect", () => {
		let { session } = makeSession()
		let url = new URL("https://example.com/login?returnTo=%2Fhistory")

		let response = flashLoginRequestError(session, url)

		expect(response.headers.get("Location")).toBe("/login?returnTo=%2Fhistory")
	})

	it("strips unsafe returnTo query on redirect", () => {
		let { session } = makeSession()
		let url = new URL("https://example.com/login?returnTo=%2F%2Fevil.com")

		let response = flashLoginRequestError(session, url)

		expect(response.headers.get("Location")).toBe("/login")
	})
})

describe("flashRegisterError", () => {
	it("flashes message and redirects to register", () => {
		let { session, flash } = makeSession()

		let response = flashRegisterError(session, "An account with this email already exists.")

		expect(flash).toHaveBeenCalledWith("error", "An account with this email already exists.")
		expect(response.status).toBe(302)
		expect(response.headers.get("Location")).toBe("/register")
	})
})

describe("flashResetPasswordError", () => {
	it("flashes message and redirects to token route", () => {
		let { session, flash } = makeSession()

		let response = flashResetPasswordError(session, "abc123", "Invalid or expired reset token.")

		expect(flash).toHaveBeenCalledWith("error", "Invalid or expired reset token.")
		expect(response.status).toBe(302)
		expect(response.headers.get("Location")).toBe("/reset-password/abc123")
	})
})
