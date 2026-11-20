import * as s from "remix/data-schema"
import * as f from "remix/data-schema/form-data"
import { redirect } from "remix/response/redirect"
import type { Controller } from "remix/router"

import { REVEAL_WORD, ROBOTS_INDEX, WORD_LENGTH } from "#app/constants.ts"
import { getReturnToQuery } from "#app/middleware/auth.ts"
import {
	createGuess,
	createGuessErrorMessage,
	getFullBoard,
	getTodaysGame,
	isGameComplete,
} from "#app/models/game.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

import { LandingPage } from "./landing-page.tsx"
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
			.transform((value) => value.map((letter) => letter.toLowerCase())),
		{ name: "letter" },
	),
	cheat: f.field(s.optional(s.string()).transform((value) => value === "true")),
})

export const home = {
	actions: {
		async action(context) {
			let auth = context.auth
			if (auth.ok === false) {
				return redirect(
					routes.auth.login.index.href(undefined, { searchParams: getReturnToQuery(context.url) }),
				)
			}

			let session = context.session
			let formData = context.formData

			let data = s.parseSafe(guessWordSchema, formData)

			if (!data.success) {
				session.flash("error", "Invalid input")
				return redirect(routes.home.index.href())
			}

			let guessedWord = data.value.letters.join("")
			let guessResult = await createGuess(auth.identity.user.id, guessedWord)

			if (guessResult.isErr()) {
				session.flash("error", createGuessErrorMessage(guessResult.error))
			}

			return redirect(
				routes.home.index.href(undefined, {
					searchParams: data.value.cheat ? { cheat: "true" } : undefined,
				}),
			)
		},

		async index(context) {
			let auth = context.auth
			if (auth.ok === false) {
				return render(<LandingPage url={context.url} />, {
					headers: { "X-Robots-Tag": ROBOTS_INDEX },
				})
			}

			let session = context.session

			let game = await getTodaysGame(auth.identity.user.id)
			let board = getFullBoard(game)

			let showModal = isGameComplete(game.status)

			let showWord = showModal || context.url.searchParams.has(REVEAL_WORD) ? board.word : undefined

			let errorMessage = session.get("error") || undefined

			if (typeof errorMessage !== "string") {
				errorMessage = undefined
			}

			return render(
				<Page
					url={context.url}
					showModal={showModal}
					showWord={showWord}
					board={board}
					error={errorMessage}
				/>,
			)
		},
	},
} satisfies Controller<typeof routes.home>
