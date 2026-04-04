import type { Controller } from "remix/fetch-router"
import { createRedirectResponse } from "remix/response/redirect"
import { Session } from "remix/session"

import { REVEAL_WORD, WORD_LENGTH } from "../constants.ts"
import { requireAuth } from "../middleware/auth.ts"
import { createGuess, getFullBoard, getTodaysGame, isGameComplete } from "../models/game.ts"
import { routes } from "../routes.ts"
import { getCurrentUser } from "../utils/context.ts"
import { render } from "../utils/render.ts"
import * as f from "./local-form-schema.ts"
import * as s from "./local-schema.ts"
import { Page } from "./page.tsx"

export function validLength(length: number): s.Check<Array<string>> {
	return {
		check(value) {
			return value.length === length
		},
		code: "array.valid_length",
		values: { length },
		message: "Expected " + String(length) + " characters",
	}
}

export const guessWordSchema = f.object({
	letters: f.fields(
		s
			.array(s.string())
			.pipe(validLength(WORD_LENGTH))
			.transform((value) => {
				return value.map((letter) => letter.toLowerCase())
			}),
		{ name: "letter" },
	),
	cheat: f.field(s.optional(s.string()).transform((value) => value === "true")),
})

export const home = {
	middleware: [requireAuth()],
	actions: {
		async action({ get }) {
			let session = get(Session)
			let formData = get(FormData)
			let user = getCurrentUser()

			let data = s.parseSafe(guessWordSchema, formData)

			if (!data.success) {
				session.flash("error", "Invalid input")
				return createRedirectResponse(routes.home.index.href())
			}

			let guessedWord = data.value.letters.join("")
			let error = await createGuess(user.id, guessedWord)

			if (error) {
				console.error({ error })
				session.flash("error", error)
			}

			return createRedirectResponse(
				routes.home.index.href(undefined, data.value.cheat ? { cheat: "true" } : {}),
			)
		},

		async index({ get, url }) {
			let session = get(Session)
			let user = getCurrentUser()

			let game = await getTodaysGame(user.id)
			let board = getFullBoard(game)

			let showModal = isGameComplete(game.status)

			let showWord = showModal || url.searchParams.has(REVEAL_WORD) ? board.word : undefined

			let errorMessage = session.get("error") || undefined

			if (typeof errorMessage !== "string") {
				errorMessage = undefined
			}

			return render(
				<Page
					setup={{ url }}
					showModal={showModal}
					showWord={showWord}
					board={board}
					error={errorMessage}
				/>,
			)
		},
	},
} satisfies Controller<typeof routes.home>
