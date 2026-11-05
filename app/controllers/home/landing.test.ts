import { readFileSync } from "node:fs"
import path from "node:path"

import { expect } from "remix/assert"
import { describe, it } from "remix/test"

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
import { router } from "#app/router.ts"
import {
	assertContains,
	assertNotContains,
	getSessionCookie,
	requestWithSession,
} from "#test/helpers.ts"

function publicFile(name: string) {
	return readFileSync(path.join(process.cwd(), "public", name), "utf8")
}

describe("logged-out landing page", () => {
	it("renders an indexable landing page at / instead of redirecting to login", async () => {
		let response = await router.fetch("https://wordle.mcan.sh/")

		expect(response.status).toBe(200)
		expect(response.headers.get("Content-Type")).toMatch(/text\/html/i)
		expect(response.headers.get("X-Robots-Tag")).toBe(ROBOTS_INDEX)

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
		expect(response.headers.get("X-Robots-Tag")).toBe(ROBOTS_NOINDEX)

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
		expect(response.headers.get("X-Robots-Tag")).toBe(ROBOTS_NOINDEX)
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
		expect(response.headers.get("Content-Type")).toMatch(/text\/plain/i)

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
		expect(response.headers.get("Content-Type")).toMatch(/xml/i)

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
