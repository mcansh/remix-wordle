import { createRouter } from "remix/fetch-router"
import { describe, expect, it, vi } from "vite-plus/test"

import { ROBOTS_CONTENT, SITE_DESCRIPTION } from "#app/constants.ts"
import { router as appRouter } from "#app/router.ts"
import { assertContains } from "#test/helpers.ts"

import { htmlRobotsTag, isHtmlContentType } from "./robots.ts"

vi.mock("#app/entry.browser.ts?assets=client", () => {
	let assets = {
		entry: "/assets/client.js",
		js: [],
		css: [],
		merge() {
			return assets
		},
	}
	return { default: assets }
})
vi.mock("#app/entry.server.ts?assets=ssr", () => {
	let assets = {
		entry: "/assets/ssr.js",
		js: [],
		css: [],
		merge() {
			return assets
		},
	}
	return { default: assets }
})
vi.mock("#app/utils/db.ts", () => ({
	redis: {
		get: vi.fn().mockResolvedValue(null),
		set: vi.fn().mockResolvedValue("OK"),
		del: vi.fn().mockResolvedValue(1),
	},
	db: {
		user: {
			findFirst: vi.fn(),
		},
	},
}))

function createNext(response: Response) {
	return vi.fn(() => Promise.resolve(response))
}

type RobotsMiddleware = ReturnType<typeof htmlRobotsTag>

function invokeHtmlRobotsTag(next: ReturnType<typeof createNext>) {
	let middleware = htmlRobotsTag()
	return middleware(
		{} as unknown as Parameters<RobotsMiddleware>[0],
		next as unknown as Parameters<RobotsMiddleware>[1],
	)
}

function assertResponse(response: unknown): asserts response is Response {
	if (!(response instanceof Response)) {
		throw new Error("Expected a Response object")
	}
}

describe("isHtmlContentType", () => {
	it("matches HTML content types", () => {
		expect(isHtmlContentType("text/html")).toBe(true)
		expect(isHtmlContentType("text/html; charset=UTF-8")).toBe(true)
		expect(isHtmlContentType("TEXT/HTML")).toBe(true)
	})

	it("does not match API or static asset content types", () => {
		expect(isHtmlContentType(null)).toBe(false)
		expect(isHtmlContentType("text/plain")).toBe(false)
		expect(isHtmlContentType("application/json")).toBe(false)
		expect(isHtmlContentType("text/css")).toBe(false)
		expect(isHtmlContentType("text/javascript")).toBe(false)
		expect(isHtmlContentType("image/png")).toBe(false)
		expect(isHtmlContentType("application/xml")).toBe(false)
	})
})

describe("htmlRobotsTag", () => {
	it("sets X-Robots-Tag on HTML responses", async () => {
		let next = createNext(
			new Response("<html></html>", {
				headers: { "Content-Type": "text/html; charset=UTF-8" },
			}),
		)

		let result = await invokeHtmlRobotsTag(next)

		assertResponse(result)
		expect(result.headers.get("X-Robots-Tag")).toBe(ROBOTS_CONTENT)
		expect(await result.text()).toBe("<html></html>")
	})

	it("does not set X-Robots-Tag on plain text API responses", async () => {
		let next = createNext(new Response("OK"))

		let result = await invokeHtmlRobotsTag(next)

		assertResponse(result)
		expect(result.headers.get("X-Robots-Tag")).toBeNull()
		expect(await result.text()).toBe("OK")
	})

	it("does not set X-Robots-Tag on JSON API responses", async () => {
		let next = createNext(Response.json({ ok: true }))

		let result = await invokeHtmlRobotsTag(next)

		assertResponse(result)
		expect(result.headers.get("X-Robots-Tag")).toBeNull()
	})

	it("does not set X-Robots-Tag on static asset responses", async () => {
		let next = createNext(
			new Response("body{}", {
				headers: { "Content-Type": "text/css" },
			}),
		)

		let result = await invokeHtmlRobotsTag(next)

		assertResponse(result)
		expect(result.headers.get("X-Robots-Tag")).toBeNull()
	})

	it("applies the header through a real router only to HTML", async () => {
		let router = createRouter({
			middleware: [htmlRobotsTag()],
		})

		router.map("*", (context) => {
			if (context.url.pathname === "/api") {
				return Response.json({ ok: true })
			}

			if (context.url.pathname === "/app.css") {
				return new Response("body{}", { headers: { "Content-Type": "text/css" } })
			}

			return new Response("<!DOCTYPE html><title>ok</title>", {
				headers: { "Content-Type": "text/html; charset=UTF-8" },
			})
		})

		let html = await router.fetch(new Request("http://localhost/login"))
		expect(html.headers.get("X-Robots-Tag")).toBe(ROBOTS_CONTENT)
		expect(html.headers.get("Content-Type")).toMatch(/text\/html/i)

		let api = await router.fetch(new Request("http://localhost/api"))
		expect(api.headers.get("X-Robots-Tag")).toBeNull()
		expect(api.headers.get("Content-Type")).toMatch(/application\/json/i)

		let asset = await router.fetch(new Request("http://localhost/app.css"))
		expect(asset.headers.get("X-Robots-Tag")).toBeNull()
		expect(asset.headers.get("Content-Type")).toMatch(/text\/css/i)
	})
})

describe("HTML document indexing", () => {
	it("adds robots meta, description, title, and X-Robots-Tag on HTML pages", async () => {
		let response = await appRouter.fetch("https://wordle.mcan.sh/login")

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toMatch(/text\/html/i)
		expect(response.headers.get("X-Robots-Tag")).toBe(ROBOTS_CONTENT)

		let html = await response.text()
		assertContains(html, "<title>Login - Remix Wordle</title>")
		assertContains(html, `name="robots"`)
		assertContains(html, ROBOTS_CONTENT)
		assertContains(html, `name="description"`)
		assertContains(html, SITE_DESCRIPTION)
	})

	it("does not send X-Robots-Tag on non-HTML redirects", async () => {
		let response = await appRouter.fetch("https://wordle.mcan.sh/logout", {
			method: "POST",
			redirect: "manual",
		})

		expect(response.status).toBe(302)
		expect(response.headers.get("X-Robots-Tag")).toBeNull()
	})
})
