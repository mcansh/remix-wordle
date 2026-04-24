import { invariant } from "@epic-web/invariant"
import { describe, expect, it } from "vitest"

import {
	assertContains,
	assertNotContains,
	getSessionCookie,
} from "../../../test/helpers.ts"
import { router } from "../../router.ts"

describe.skip("auth handlers", () => {
	describe("GET /login", () => {
		it("renders the login page", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/login")
			expect(response.status).toBe(200)
			let html = await response.text()
			assertContains(html, "Email address")
		})
	})

	describe("POST /login", () => {
		it("redirects to home on valid credentials", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/login", {
				method: "POST",
				body: new URLSearchParams({
					email: "testuser@example.com",
					password: "mytestaccountpassword",
				}),
				redirect: "manual",
			})

			expect(response.status).toBe(302)
			expect(response.headers.get("Location")).toBe("/")
			let sessionCookie = getSessionCookie(response)
			expect(sessionCookie).toBeTruthy()
		})

		it("redirects back to login on invalid credentials", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/login", {
				method: "POST",
				body: new URLSearchParams({
					email: "wrong@example.com",
					password: "wrongpassword",
				}),
				redirect: "manual",
			})

			expect(response.status).toBe(302)
			let location = response.headers.get("Location")
			invariant(location, "Location header not found")
			expect(location.startsWith("/login")).toBe(true)
		})

		it("shows error message after failed login", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/login", {
				method: "POST",
				body: new URLSearchParams({
					email: "wrong@example.com",
					password: "wrongpassword",
				}),
				redirect: "manual",
			})

			let sessionCookie = getSessionCookie(response)
			let location = response.headers.get("Location")
			invariant(location, "Location header not found")

			let followUp = await router.fetch("https://wordle.mcan.sh" + location, {
				headers: { Cookie: `session=${sessionCookie}` },
			})

			let html = await followUp.text()
			assertContains(html, "Invalid email or password")
		})

		it("redirects to returnTo destination on successful login", async () => {
			let response = await router.fetch(
				"https://wordle.mcan.sh/login?returnTo=" +
					encodeURIComponent("/history"),
				{
					method: "POST",
					body: new URLSearchParams({
						email: "testuser@example.com",
						password: "mytestaccountpassword",
					}),
					redirect: "manual",
				},
			)

			expect(response.status).toBe(302)
			expect(response.headers.get("Location")).toBe("/history")
		})

		it("preserves a safe returnTo param on failed login", async () => {
			let response = await router.fetch(
				"https://wordle.mcan.sh/login?returnTo=" +
					encodeURIComponent("/history"),
				{
					method: "POST",
					body: new URLSearchParams({
						email: "wrong@example.com",
						password: "wrongpassword",
					}),
					redirect: "manual",
				},
			)

			expect(response.status).toBe(302)
			let location = response.headers.get("Location")
			invariant(location, "Location header not found")
			expect(location).toContain("returnTo=")
			expect(location).toContain(encodeURIComponent("/history"))
		})

		it("does not redirect to an unsafe open-redirect returnTo on success", async () => {
			let response = await router.fetch(
				"https://wordle.mcan.sh/login?returnTo=" +
					encodeURIComponent("//evil.com"),
				{
					method: "POST",
					body: new URLSearchParams({
						email: "testuser@example.com",
						password: "mytestaccountpassword",
					}),
					redirect: "manual",
				},
			)

			expect(response.status).toBe(302)
			expect(response.headers.get("Location")).toBe("/")
		})
	})

	describe("GET /register", () => {
		it("renders the register page", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/register")
			expect(response.status).toBe(200)
			let html = await response.text()
			assertContains(html, "Email address")
		})
	})

	describe("POST /register", () => {
		it("redirects to home after successful registration", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/register", {
				method: "POST",
				body: new URLSearchParams({
					email: "newuser@example.com",
					username: "newuser",
					password: "supersecretpassword",
				}),
				redirect: "manual",
			})

			expect(response.status).toBe(302)
			expect(response.headers.get("Location")).toBe("/")
		})

		it("redirects back to register when email already exists", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/register", {
				method: "POST",
				body: new URLSearchParams({
					email: "testuser@example.com",
					username: "testuser",
					password: "supersecretpassword",
				}),
				redirect: "manual",
			})

			expect(response.status).toBe(302)
			let location = response.headers.get("Location")
			invariant(location, "Location header not found")
			expect(location.startsWith("/register")).toBe(true)
		})

		it("shows error when attempting to register with an existing email", async () => {
			let firstResponse = await router.fetch(
				"https://wordle.mcan.sh/register",
				{
					method: "POST",
					body: new URLSearchParams({
						email: "testuser@example.com",
						username: "testuser",
						password: "supersecretpassword",
					}),
					redirect: "manual",
				},
			)

			let sessionCookie = getSessionCookie(firstResponse)
			let location = firstResponse.headers.get("Location")
			invariant(location, "Location header not found")

			let followUp = await router.fetch("https://wordle.mcan.sh" + location, {
				headers: { Cookie: `session=${sessionCookie}` },
			})

			let html = await followUp.text()
			assertContains(html, "already exists")
		})
	})

	describe("POST /logout", () => {
		it("redirects to home after logout", async () => {
			let response = await router.fetch("https://wordle.mcan.sh/logout", {
				method: "POST",
				redirect: "manual",
			})

			expect(response.status).toBe(302)
			expect(response.headers.get("Location")).toBe("/")
		})

		it("does not destroy the session cookie on logout (only unsets auth)", async () => {
			let loginResponse = await router.fetch("https://wordle.mcan.sh/login", {
				method: "POST",
				body: new URLSearchParams({
					email: "testuser@example.com",
					password: "mytestaccountpassword",
				}),
				redirect: "manual",
			})

			let sessionCookie = getSessionCookie(loginResponse)

			let logoutResponse = await router.fetch("https://wordle.mcan.sh/logout", {
				method: "POST",
				headers: { Cookie: `session=${sessionCookie}` },
				redirect: "manual",
			})

			expect(logoutResponse.status).toBe(302)
			let updatedCookie = getSessionCookie(logoutResponse)
			expect(updatedCookie).not.toBeNull()
		})
	})

	describe("error flash messages are cleared after display", () => {
		it("does not show error on second visit after login failure", async () => {
			let loginResponse = await router.fetch("https://wordle.mcan.sh/login", {
				method: "POST",
				body: new URLSearchParams({
					email: "wrong@example.com",
					password: "wrongpassword",
				}),
				redirect: "manual",
			})

			let sessionCookie = getSessionCookie(loginResponse)
			let location = loginResponse.headers.get("Location")
			invariant(location, "location header should exist")

			let firstVisit = await router.fetch("https://wordle.mcan.sh" + location, {
				headers: { Cookie: `session=${sessionCookie}` },
			})
			let firstSessionCookie = getSessionCookie(firstVisit) || sessionCookie
			let firstHtml = await firstVisit.text()
			assertContains(firstHtml, "Invalid email or password")

			let secondVisit = await router.fetch(
				"https://wordle.mcan.sh" + location,
				{
					headers: { Cookie: `session=${firstSessionCookie}` },
				},
			)
			let secondHtml = await secondVisit.text()
			assertNotContains(secondHtml, "Invalid email or password")
		})
	})
})
