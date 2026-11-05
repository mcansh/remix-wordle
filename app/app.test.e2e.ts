import type { Page } from "playwright"
import { expect } from "remix/assert"
import { createTestServer } from "remix/node-fetch-server/test"
import { beforeEach, describe, it } from "remix/test"
import type { TestContext } from "remix/test"

import { router } from "#app/router.ts"
import { resetDbMocks } from "#test/mocks/db.ts"

type Account = {
	email: string
	username: string
	password: string
}

const LOSS_GUESSES = ["cigar", "rebut", "awake", "blush", "focal", "evade", "naval", "serve"]

function uniqueAccount(): Account {
	let id = crypto.randomUUID()
	return {
		email: `e2e-${id}@example.com`,
		username: `e2e${id.replaceAll("-", "").slice(0, 12)}`,
		password: "password1234",
	}
}

async function openApp(t: TestContext) {
	return t.serve(await createTestServer(router.fetch))
}

async function register(page: Page, account: Account) {
	await page.goto("/register")
	await page.getByLabel("Email address").fill(account.email)
	await page.getByLabel("Username").fill(account.username)
	await page.getByLabel("Password").fill(account.password)
	await page.getByRole("button", { name: "Join now" }).click()
}

async function login(page: Page, account: Pick<Account, "email" | "password">) {
	if (!new URL(page.url()).pathname.endsWith("/login")) {
		await page.goto("/login")
	}
	await page.getByLabel("Email address").fill(account.email)
	await page.getByLabel("Password").fill(account.password)
	await page.getByRole("button", { name: "Log in" }).click()
}

async function submitGuess(page: Page, word: string) {
	let inputs = page.locator("#current-guess input[name='letter']")
	for (let index = 0; index < word.length; index += 1) {
		await inputs.nth(index).fill(word[index] ?? "")
	}
	await page.getByRole("button", { name: "Submit Guess" }).click()
}

async function readRevealedWord(page: Page) {
	let text = await page.getByRole("heading", { name: /Your word is / }).textContent()
	let word = text
		?.replace(/^Your word is\s+/i, "")
		.trim()
		.toLowerCase()
	if (!word || word.length !== 5) {
		throw new Error(`Could not read revealed word from ${text ?? "(empty)"}`)
	}
	return word
}

describe("player flows", () => {
	beforeEach(() => {
		resetDbMocks()
	})

	it("shows the logged-out landing page", async (t) => {
		let page = await openApp(t)

		await page.goto("/")

		await page.getByRole("heading", { name: "Remix Wordle", exact: true }).waitFor()
		await page.getByRole("heading", { name: "How to play" }).waitFor()
		await page.getByRole("link", { name: "Log in" }).waitFor()
		await page.getByRole("link", { name: "Sign up" }).waitFor()
		expect(await page.getByRole("button", { name: "Submit Guess" }).count()).toBe(0)
	})

	it("signs up a new player then logs in again", async (t) => {
		let page = await openApp(t)
		let account = uniqueAccount()

		await register(page, account)
		await page.getByRole("button", { name: "Submit Guess" }).waitFor()

		await page.request.post("/logout")
		await page.goto("/")
		await page.getByRole("heading", { name: "How to play" }).waitFor()

		await page.getByRole("link", { name: "Log in" }).click()
		await login(page, account)
		await page.getByRole("button", { name: "Submit Guess" }).waitFor()
	})

	it("logs in with an existing account", async (t) => {
		let page = await openApp(t)

		await login(page, {
			email: "testuser@example.com",
			password: "mytestaccountpassword",
		})
		await page.getByRole("button", { name: "Submit Guess" }).waitFor()
	})

	it("plays a game through to a win", async (t) => {
		let page = await openApp(t)

		await register(page, uniqueAccount())
		await page.goto("/?cheat")
		let word = await readRevealedWord(page)
		await submitGuess(page, word)

		await page.getByRole("heading", { name: "Game Summary" }).waitFor()
		await page.getByText(`The word was ${word}`).waitFor()
	})

	it("plays a game through to a loss", async (t) => {
		let page = await openApp(t)

		await register(page, uniqueAccount())
		await page.goto("/?cheat")
		let word = await readRevealedWord(page)
		let misses = LOSS_GUESSES.filter((guess) => guess !== word).slice(0, 6)
		expect(misses.length).toBe(6)

		for (let guess of misses) {
			await page.goto("/?cheat")
			await submitGuess(page, guess)
		}

		await page.getByRole("heading", { name: "Game Summary" }).waitFor()
		await page.getByText(`The word was ${word}`).waitFor()
	})

	it("rejects an invalid guess", async (t) => {
		let page = await openApp(t)

		await register(page, uniqueAccount())
		await page.getByRole("button", { name: "Submit Guess" }).waitFor()
		await submitGuess(page, "zzzzz")

		await page.getByText("ZZZZZ is not a valid word").waitFor()
	})
})
