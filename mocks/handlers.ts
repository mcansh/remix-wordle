import { setTimeout } from "node:timers/promises"

import type { HttpHandler } from "msw"
import { http, passthrough } from "msw"

function randomNumberBetween(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export let handlers = [
	// Intercept all HTTP requests.
	http.all("*", async () => {
		let delay = randomNumberBetween(100, 3_000)
		// Apply random delay to them.
		await setTimeout(delay)
		// Then resolve them as-is, no mocking.
		return passthrough()
	}),
] satisfies Array<HttpHandler>
