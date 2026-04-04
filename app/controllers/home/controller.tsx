import { Auth, type BadAuth, type GoodAuth } from "remix/auth-middleware"
import type { Controller } from "remix/fetch-router"
import { createRedirectResponse, redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { REVEAL_WORD, WORD_LENGTH } from "../../constants.ts"
import { getReturnToQuery, requireAuth } from "../../middleware/auth.ts"
import { createGuess, getFullBoard, getTodaysGame, isGameComplete } from "../../models/game.ts"
import { routes } from "../../routes.ts"
import type { AuthIdentity } from "../../utils/auth-session.ts"
import * as f from "../../utils/local-form-schema.ts"
import * as s from "../../utils/local-schema.ts"
import { render } from "../../utils/render.ts"
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
	middleware: [requireAuth],
	actions: {
		async action(context) {
			let auth = context.get(Auth) as GoodAuth<AuthIdentity> | BadAuth
			if (auth.ok === false) {
				return redirect(routes.auth.login.index.href(undefined, getReturnToQuery(context.url)))
			}

			let session = context.get(Session)
			let formData = context.get(FormData)

			let data = s.parseSafe(guessWordSchema, formData)

			if (!data.success) {
				session.flash("error", "Invalid input")
				return createRedirectResponse(routes.home.index.href())
			}

			let guessedWord = data.value.letters.join("")
			let error = await createGuess(auth.identity.user.id, guessedWord)

			if (error) {
				console.error({ error })
				session.flash("error", error)
			}

			return createRedirectResponse(
				routes.home.index.href(undefined, data.value.cheat ? { cheat: "true" } : {}),
			)
		},

		async index(context) {
			let auth = context.get(Auth) as GoodAuth<AuthIdentity> | BadAuth
			if (auth.ok === false) {
				return redirect(routes.auth.login.index.href(undefined, getReturnToQuery(context.url)))
			}

			let session = context.get(Session)

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
					setup={{ url: context.url }}
					showModal={showModal}
					showWord={showWord}
					board={board}
					error={errorMessage}
				/>,
			)
		},
	},
} satisfies Controller<typeof routes.home>
