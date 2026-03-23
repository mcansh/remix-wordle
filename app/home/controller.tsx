import type { Controller } from "remix/fetch-router"
import { createRedirectResponse } from "remix/response/redirect"
import { Session } from "remix/session"

import { REVEAL_WORD } from "../constants.ts"
import { requireAuth } from "../middleware/auth.ts"
import { createGuess, getFullBoard, getTodaysGame, isGameComplete } from "../models/game.ts"
import { routes } from "../routes.ts"
import { getCurrentUser } from "../utils/context.ts"
import { renderDocument } from "../utils/render.tsx"
import { GamePage } from "./page.tsx"

export const home = {
	middleware: [requireAuth()],
	actions: {
		async action({ get }) {
			let session = get(Session)
			let formData = get(FormData)
			let user = getCurrentUser()
			let letters = formData.getAll("letter")
			let revealWord = formData.get("cheat") === "true"

			let guessedWord = letters.join("")
			let error = await createGuess(user.id, guessedWord)

			if (error) {
				console.error({ error })
				session.flash("error", error)
			}

			return createRedirectResponse(
				routes.home.index.href(undefined, revealWord ? { cheat: "true" } : {}),
			)
		},

		async index({ get, url }) {
			let session = get(Session)
			let user = getCurrentUser()

			let game = await getTodaysGame(user.id)
			let board = getFullBoard(game)

			let showModal = isGameComplete(game.status)

			let showWord = showModal || url.searchParams.has(REVEAL_WORD) ? board.word : null

			let errorMessage = session.get("error") || null

			if (typeof errorMessage !== "string") {
				errorMessage = null
			}

			return renderDocument(
				<GamePage
					showModal={showModal}
					board={board}
					error={errorMessage}
					game={game}
					showWord={showWord}
				/>,
			)
		},
	},
} satisfies Controller<typeof routes.home>
