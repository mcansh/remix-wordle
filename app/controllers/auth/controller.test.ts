import { describe, expect, it, vi } from "vite-plus/test"

import { router } from "#app/router.ts"
import { assertContains, getSessionCookie } from "#test/helpers.ts"

vi.mock("./models/user.ts", async (importActual) => {
	let actual = await importActual<typeof import("../../models/user.ts")>()
	return {
		...actual,
		authenticateUser: vi.fn().mockImplementation(async (email: string, password: string) => {
			if (email === "testuser@example.com" && password === "mytestaccountpassword") {
				return {
					id: "user-123",
					email,
					username: "testuser",
					password: "hashed-password", // In real case, this would be hashed
				}
			}

			return null
		}),
	}
})

describe.skip("auth handlers", () => {
	it("POST /login with valid credentials sets session cookie and redirects", async () => {
		let response = await router.fetch("https://remix.run/login", {
			method: "POST",
			body: new URLSearchParams({
				email: "testuser@example.com",
				password: "mytestaccountpassword",
			}),
			redirect: "manual",
		})

		expect(response.status).toBe(302)
		expect(response.headers.get("Location")).toBe("/")

		let sessionId = getSessionCookie(response)
		expect(sessionId).toBeTruthy()
	})

	it("POST /login with invalid credentials redirects back to login with error", async () => {
		let response = await router.fetch("https://remix.run/login", {
			method: "POST",
			body: new URLSearchParams({
				email: "wrong@example.com",
				password: "wrongpassword",
			}),
			redirect: "manual",
		})

		expect.assert.equal(response.status, 302)
		expect.assert.equal(response.headers.get("Location"), "/login")

		// Follow redirect to see the error message
		let sessionCookie = getSessionCookie(response)
		let followUpResponse = await router.fetch("https://remix.run/login", {
			headers: {
				Cookie: `session=${sessionCookie}`,
			},
		})

		let html = await followUpResponse.text()
		// assertContains(html, 'Invalid email or password')
	})

	it.skip("flash error message is cleared after being displayed once", async () => {
		// POST invalid credentials to trigger flash message
		let response = await router.fetch("https://remix.run/login", {
			method: "POST",
			body: new URLSearchParams({
				email: "wrong@example.com",
				password: "wrongpassword",
			}),
			redirect: "manual",
		})

		expect.assert.equal(response.status, 302)
		expect.assert.equal(response.headers.get("Location"), "/login")

		// Follow redirect to see the error message (first request)
		let sessionCookie = getSessionCookie(response)
		let firstFollowUp = await router.fetch("https://remix.run/login", {
			headers: {
				Cookie: `session=${sessionCookie}`,
			},
		})

		let firstHtml = await firstFollowUp.text()
		// assertContains(firstHtml, 'Invalid email or password')

		// Get updated session cookie (session should be updated to clear flash)
		let updatedSessionCookie = getSessionCookie(firstFollowUp) || sessionCookie

		// Refresh the page (second request) - error should NOT be shown
		let secondFollowUp = await router.fetch("https://remix.run/login", {
			headers: {
				Cookie: `session=${updatedSessionCookie}`,
			},
		})

		let secondHtml = await secondFollowUp.text()
		expect.assert.ok(
			!secondHtml.includes("Invalid email or password"),
			"Expected flash error to be cleared after first display",
		)
	})

	it.skip("POST /register creates new user and sets session", async () => {
		let uniqueEmail = `newuser-${Date.now()}@example.com`

		let response = await router.fetch("https://remix.run/register", {
			method: "POST",
			body: new URLSearchParams({
				name: "New User",
				email: uniqueEmail,
				password: "password123",
			}),
			redirect: "manual",
		})

		expect.assert.equal(response.status, 302)
		expect.assert.equal(response.headers.get("Location"), "/account")

		let sessionId = getSessionCookie(response)
		expect.assert.ok(sessionId, "Expected session cookie to be set")
	})

	it("accessing protected route redirects to login with returnTo parameter", async () => {
		let response = await router.fetch("https://remix.run/history", { redirect: "manual" })

		expect(response.status).toBe(302)
		let location = response.headers.get("Location")
		expect(location).toBeTruthy()
		expect(location!.startsWith("/login?returnTo="), "Expected redirect to login with returnTo")
		expect(
			location!.includes(encodeURIComponent("/checkout")),
			"Expected returnTo to contain /checkout",
		)
	})

	it("successful login with returnTo redirects to original destination", async () => {
		let response = await router.fetch(
			"https://v2.wordle.mcan.sh/login?returnTo=" + encodeURIComponent("/checkout"),
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
		expect(response.headers.get("Location")).toBe("/checkout")

		let sessionId = getSessionCookie(response)
		expect(sessionId).toBeTruthy()
	})

	it("failed login with returnTo preserves returnTo parameter", async () => {
		let response = await router.fetch(
			"https://remix.run/login?returnTo=" + encodeURIComponent("/checkout"),
			{
				method: "POST",
				body: new URLSearchParams({
					email: "wrong@example.com",
					password: "wrongpassword",
				}),
				redirect: "manual",
			},
		)

		expect.assert.equal(response.status, 302)
		let location = response.headers.get("Location")
		expect.assert.ok(location, "Expected Location header")
		expect.assert.ok(
			location.includes("returnTo=" + encodeURIComponent("/checkout")),
			"Expected returnTo to be preserved in redirect",
		)

		// Follow redirect to verify error message is shown
		let sessionCookie = getSessionCookie(response)
		let followUpResponse = await router.fetch("https://remix.run" + location, {
			headers: {
				Cookie: `session=${sessionCookie}`,
			},
		})

		let html = await followUpResponse.text()
		// assertContains(html, 'Invalid email or password')
		assertContains(html, "returnTo=" + encodeURIComponent("/checkout"))
	})

	it.skip("POST /reset-password with mismatched passwords redirects back with error", async () => {
		// First, request a password reset to get a token
		let forgotPasswordResponse = await router.fetch("https://remix.run/forgot-password", {
			method: "POST",
			body: new URLSearchParams({
				email: "customer@example.com",
			}),
		})

		let html = await forgotPasswordResponse.text()
		// Extract token from the reset link in the demo response
		let tokenMatch = html.match(/\/reset-password\/([^"]+)/)
		expect.assert.ok(tokenMatch, "Expected to find reset token in response")
		let token = tokenMatch[1]

		// Try to reset password with mismatched passwords
		let response = await router.fetch(`https://remix.run/reset-password/${token}`, {
			method: "POST",
			body: new URLSearchParams({
				password: "newpassword123",
				confirmPassword: "differentpassword",
			}),
			redirect: "manual",
		})

		expect.assert.equal(response.status, 302)
		expect.assert.equal(response.headers.get("Location"), `/reset-password/${token}`)

		// Follow redirect to see the error message
		let sessionCookie = getSessionCookie(response)
		let followUpResponse = await router.fetch(`https://remix.run/reset-password/${token}`, {
			headers: {
				Cookie: `session=${sessionCookie}`,
			},
		})

		let errorHtml = await followUpResponse.text()
		assertContains(errorHtml, "Passwords do not match")
	})

	it.skip("POST /reset-password with invalid token redirects back with error", async () => {
		let invalidToken = "invalid-token-12345"

		let response = await router.fetch(`https://remix.run/reset-password/${invalidToken}`, {
			method: "POST",
			body: new URLSearchParams({
				password: "newpassword123",
				confirmPassword: "newpassword123",
			}),
			redirect: "manual",
		})

		expect.assert.equal(response.status, 302)
		expect.assert.equal(response.headers.get("Location"), `/reset-password/${invalidToken}`)

		// Follow redirect to see the error message
		let sessionCookie = getSessionCookie(response)
		let followUpResponse = await router.fetch(`https://remix.run/reset-password/${invalidToken}`, {
			headers: {
				Cookie: `session=${sessionCookie}`,
			},
		})

		let errorHtml = await followUpResponse.text()
		assertContains(errorHtml, "Invalid or expired reset token")
	})
})
