import type { Err, Ok, Result } from "better-result"
import { Cookie, SetCookie } from "remix/headers"
import type { Router } from "remix/router"

/**
 * Extract a specific cookie value from Set-Cookie headers
 */
export function getCookie(response: Response, name: string): string | null {
	let setCookieHeaders = response.headers.getSetCookie()

	for (let header of setCookieHeaders) {
		let setCookie = new SetCookie(header)
		if (setCookie.name === name) {
			return setCookie.value ?? null
		}
	}

	return null
}

/**
 * Extract session cookie from Set-Cookie headers
 */
export function getSessionCookie(response: Response): string | null {
	return getCookie(response, "session")
}

/**
 * Create a request with a session cookie
 */
export function requestWithSession(
	url: string,
	sessionCookie: string,
	init?: RequestInit,
): Request {
	let cookie = new Cookie({ session: sessionCookie })

	let headers = new Headers(init?.headers)
	headers.append("Cookie", cookie.toString())

	return new Request(url, { ...init, headers })
}

/**
 * Assert that HTML contains a substring
 */
export function assertContains(html: string, text: string): void {
	if (!html.includes(text)) {
		throw new Error(`Expected HTML to contain "${text}"`)
	}
}

/**
 * Assert that HTML does not contain a substring
 */
export function assertNotContains(html: string, text: string): void {
	if (html.includes(text)) {
		throw new Error(`Expected HTML to not contain "${text}"`)
	}
}

/**
 * Login and return the session cookie
 */
export async function login(router: Router, email: string, password: string): Promise<string> {
	let loginResponse = await router.fetch("https://wordle.mcan.sh/login", {
		method: "POST",
		body: new URLSearchParams({ email, password }),
		redirect: "manual",
	})

	let sessionId = getSessionCookie(loginResponse)
	if (!sessionId) {
		throw new Error("Failed to get session cookie from login response")
	}

	return sessionId
}

/**
 * Login as customer and return the session cookie
 */
export function loginAsCustomer(router: Router): Promise<string> {
	return login(router, "customer@example.com", "password123")
}

/**
 * Asserts that a Result is Ok
 * @param {Result<T, E>} result - The result to check
 */
export function assertOk<T, E>(result: Result<T, E>): asserts result is Ok<T, E> {
	if (result.isErr()) {
		throw new Error(`Expected ok result, received error`)
	}
}

/**
 * Asserts that a Result is Err
 * @param {Result<T, E>} result - The result to check
 */
export function assertErr<T, E>(result: Result<T, E>): asserts result is Err<T, E> {
	if (result.isOk()) {
		throw new Error("Expected an error result, received ok")
	}
}
