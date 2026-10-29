/** @vitest-environment node */
import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it, vi } from "vite-plus/test"

import {
	LANDING_TITLE,
	ROBOTS_INDEX,
	ROBOTS_NOINDEX,
	SITE_DESCRIPTION,
	SITE_IMAGE_URL,
	SITE_JSON_LD,
	SITE_TITLE,
	SITE_URL,
} from "#app/constants.ts"
import { ROBOTS_TXT } from "#app/controllers/robots.ts"
import { SITEMAP_XML } from "#app/controllers/sitemap.ts"
import type { FullGame } from "#app/models/game.ts"
import { router } from "#app/router.ts"
import {
	assertContains,
	assertNotContains,
	getSessionCookie,
	requestWithSession,
} from "#test/helpers.ts"

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
vi.mock("bcryptjs", () => ({
	default: {
		compare: vi.fn().mockImplementation(async (plain: string, hashed: string) => {
			return hashed === `hashed-${plain}`
		}),
		hash: vi.fn().mockImplementation(async (plain: string) => `hashed-${plain}`),
	},
}))
vi.mock("#app/utils/db.ts", () => {
	let store = new Map<string, string>()
	return {
		redis: {
			get: vi.fn(async (key: string) => store.get(key) ?? null),
			set: vi.fn(async (key: string, value: string) => {
				store.set(key, value)
				return "OK"
			}),
			del: vi.fn(async (key: string) => {
				store.delete(key)
				return 1
			}),
		},
		db: {
			user: {
				findFirst: vi
					.fn()
					.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
						if (where.email === "testuser@example.com" || where.id === "user-123") {
							return {
								id: "user-123",
								email: "testuser@example.com",
								username: "testuser",
								password: "hashed-mytestaccountpassword",
							}
						}
						return null
					}),
			},
		},
	}
})
vi.mock("#app/models/game.ts", async (importActual) => {
	let actual = await importActual<typeof import("#app/models/game.ts")>()

	return {
		...actual,
		getTodaysGame: vi.fn().mockImplementation(async () => {
			return {
				id: "game-123",
				word: "apple",
				status: "IN_PROGRESS",
				createdAt: new Date(),
				updatedAt: new Date(),
				guesses: [],
			} satisfies FullGame
		}),
	}
})

function publicFile(name: string) {
	return readFileSync(path.join(process.cwd(), "public", name), "utf8")
}

describe("logged-out landing page", () => {
	it("renders an indexable landing page at / instead of redirecting to login", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/")

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toMatch(/text\/html/i)
		expect(response.headers.get("X-Robots-Tag")).toBeNull()

		let html = await response.text()
		assertContains(html, `<title>${LANDING_TITLE}</title>`)
		assertContains(html, `name="description"`)
		assertContains(html, SITE_DESCRIPTION)
		assertContains(html, `name="robots"`)
		assertContains(html, ROBOTS_INDEX)
		assertNotContains(html, ROBOTS_NOINDEX)
		assertNotContains(html, "noindex")
		assertContains(html, `rel="canonical"`)
		assertContains(html, `href="${SITE_URL}"`)
		assertContains(html, `property="og:title"`)
		assertContains(html, `property="og:description"`)
		assertContains(html, `property="og:url"`)
		assertContains(html, `property="og:image"`)
		assertContains(html, `content="${SITE_IMAGE_URL}"`)
		assertContains(html, `name="twitter:card"`)
		assertContains(html, `content="summary"`)
		assertContains(html, `name="twitter:title"`)
		assertContains(html, `type="application/ld+json"`)
		assertContains(html, "WebApplication")
		assertContains(html, SITE_JSON_LD)
		assertContains(html, SITE_TITLE)
		assertContains(html, "How to play")
		assertContains(html, "five-letter")
		assertContains(html, 'href="/login"')
		assertContains(html, "Log in")
		assertContains(html, 'href="/register"')
		assertContains(html, "Sign up")
		assertNotContains(html, "Submit Guess")
	})

	it("keeps the production canonical when the request host is not wordle.mcan.sh", async () => {
		let response = await router.fetch("http://localhost:44100/")
		let html = await response.text()

		assertContains(html, `rel="canonical"`)
		assertContains(html, `href="${SITE_URL}"`)
		assertContains(html, `property="og:url"`)
		assertContains(html, `content="${SITE_URL}"`)
	})
})

describe("app and account routes stay noindex", () => {
	it("adds noindex to the login page", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/login")
		expect(response.status).toBe(200)
		expect(response.headers.get("X-Robots-Tag")).toBeNull()

		let html = await response.text()
		assertContains(html, `<title>Login - Remix Wordle</title>`)
		assertContains(html, `name="robots"`)
		assertContains(html, ROBOTS_NOINDEX)
		assertNotContains(html, ROBOTS_INDEX)
	})

	it("adds noindex to the register page", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/register")
		expect(response.status).toBe(200)

		let html = await response.text()
		assertContains(html, `name="robots"`)
		assertContains(html, ROBOTS_NOINDEX)
	})

	it("still redirects logged-out visitors away from game history", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/history", { redirect: "manual" })
		expect(response.status).toBe(302)
		expect(response.headers.get("Location")).toBe("/login")
	})

	it("still redirects unauthenticated guess submissions to login", async () => {
		let formData = new FormData()
		formData.append("letter", "a")
		formData.append("letter", "p")
		formData.append("letter", "p")
		formData.append("letter", "l")
		formData.append("letter", "e")

		let response = await router.fetch("https://wordle.mcan.sh/", {
			method: "POST",
			body: formData,
			redirect: "manual",
		})

		expect(response.status).toBe(302)
		let location = response.headers.get("Location")
		expect(location).toBeTruthy()
		expect(location!.startsWith("/login")).toBe(true)
	})
})

describe("logged-in home stays the game", () => {
	it("renders the game board instead of the landing page", async () => {
		let loginResponse = await router.fetch("https://wordle.mcan.sh/login", {
			method: "POST",
			body: new URLSearchParams({
				email: "testuser@example.com",
				password: "mytestaccountpassword",
			}),
			redirect: "manual",
		})

		expect(loginResponse.status).toBe(302)
		expect(loginResponse.headers.get("Location")).toBe("/")
		let sessionCookie = getSessionCookie(loginResponse)
		expect(sessionCookie).toBeTruthy()

		let response = await router.fetch(requestWithSession("https://wordle.mcan.sh/", sessionCookie!))

		expect(response.status).toBe(200)
		let html = await response.text()
		assertContains(html, "Submit Guess")
		assertContains(html, `<title>Remix Wordle</title>`)
		assertContains(html, ROBOTS_NOINDEX)
		assertNotContains(html, ROBOTS_INDEX)
		assertNotContains(html, "How to play")
		assertNotContains(html, "Sign up")
	})
})

describe("robots.txt and sitemap.xml", () => {
	it("serves robots.txt that allows the landing page and points at the sitemap", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/robots.txt")

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toMatch(/text\/plain/i)

		let body = await response.text()
		expect(body).toBe(ROBOTS_TXT)
		expect(body).toContain("User-agent: *")
		expect(body).toContain("Allow: /")
		expect(body).toContain("Sitemap: https://wordle.mcan.sh/sitemap.xml")
		expect(body).not.toMatch(/Disallow:\s*\//)
		expect(publicFile("robots.txt")).toBe(ROBOTS_TXT)
	})

	it("serves a sitemap that lists only the public landing page", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/sitemap.xml")

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toMatch(/xml/i)

		let body = await response.text()
		expect(body).toBe(SITEMAP_XML)
		assertContains(body, SITE_URL)
		assertNotContains(body, "/login")
		assertNotContains(body, "/register")
		assertNotContains(body, "/history")
		assertNotContains(body, "/health")
		assertNotContains(body, "wordle.mcansh.com")
		expect(publicFile("sitemap.xml")).toBe(SITEMAP_XML)
	})
})
