import { SELF } from "@mcansh/http-helmet"
import { createRouter } from "remix/fetch-router"
import { describe, expect, it, vi } from "vitest"

import { securityHeaders } from "./security.ts"

function createMockContext(
	overrides: {
		method?: string
		pathname?: string
		search?: string
	} = {},
) {
	let { method = "GET", pathname = "/", search = "" } = overrides
	let url = new URL(`${pathname}${search}`, "http://localhost")
	let headers = new Headers()
	let request = new Request(url, { method, headers })

	return {
		request,
		headers: request.headers,
		url: new URL(request.url),
	}
}

function createNext(responseBody = "OK") {
	return vi.fn(() => Promise.resolve(new Response(responseBody)))
}

type TestContext = ReturnType<typeof createMockContext>
type TestNext = ReturnType<typeof createNext>
type SecurityHeadersMiddleware = ReturnType<typeof securityHeaders>

function invokeSecurityHeaders(
	middleware: SecurityHeadersMiddleware,
	context: TestContext,
	next: TestNext,
) {
	return middleware(
		context as unknown as Parameters<SecurityHeadersMiddleware>[0],
		next as unknown as Parameters<SecurityHeadersMiddleware>[1],
	)
}

function assertResponse(response: unknown): asserts response is Response {
	if (!(response instanceof Response)) {
		throw new Error("Expected a Response object")
	}
}

describe("securityHeaders", () => {
	it("does not add anything when nothing is configured", async () => {
		let middleware = securityHeaders({})
		let next = createNext()

		let result = await invokeSecurityHeaders(middleware, createMockContext(), next)

		assertResponse(result)

		expect(Object.fromEntries(result.headers.entries())).toEqual({
			"Content-Type": "text/plain;charset=UTF-8",
		})
	})

	it("adds security headers to the response", async () => {
		let middleware = securityHeaders({
			"Content-Security-Policy": {
				"img-src": [SELF],
			},
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Resource-Policy": "same-origin",
			"Referrer-Policy": "strict-origin-when-cross-origin",
			"X-Frame-Options": "DENY",
			"X-XSS-Protection": "1; mode=block",
			"X-DNS-Prefetch-Control": "on",
			"X-Content-Type-Options": "nosniff",
			"Strict-Transport-Security": true,
		})

		let next = createNext()

		let result = await invokeSecurityHeaders(middleware, createMockContext(), next)

		assertResponse(result)

		expect(result.headers.get("Content-Security-Policy")).toBe("img-src 'self'")
		expect(result.headers.get("Cross-Origin-Embedder-Policy")).toBe("require-corp")
		expect(result.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin")
		expect(result.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin")
		expect(result.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin")
	})

	it("rate limits through a real router but skips non-GET requests", async () => {
		let router = createRouter({
			middleware: [
				securityHeaders({
					"Content-Security-Policy": {
						"img-src": [SELF],
					},
					skip: (context) => context.request.method !== "GET",
				}),
			],
		})

		router.map("*", (context) => {
			return new Response(`ok:${context.url.pathname}`)
		})

		let get = await router.fetch(new Request("http://localhost"))

		expect(get.status).toBe(200)
		expect(get.headers.get("Content-Security-Policy")).toBe("img-src 'self'")

		let post = await router.fetch(new Request("http://localhost", { method: "POST" }))

		expect(post.status).toBe(200)
	})
})
