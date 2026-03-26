import type { Controller } from "remix/fetch-router"
import { Session } from "remix/session"

import { REVEAL_WORD } from "../constants"
import { loadAuth } from "../middleware/auth"
import { getFullBoard, getTodaysGame, isGameComplete } from "../models/game"
import { routes } from "../routes"
import { getCurrentUserSafely } from "../utils/context"
import { render } from "../utils/render"
import { GameBoard } from "./board"

export const framesController = {
	middleware: [loadAuth()],
	actions: {
		async board({ get, url }) {
			let session = get(Session)
			let user = getCurrentUserSafely()

			if (!user) return new Response("Unauthorized", { status: 401 })

			let game = await getTodaysGame(user.id)
			let board = getFullBoard(game)

			let showModal = isGameComplete(game.status)

			let showWord = showModal || url.searchParams.has(REVEAL_WORD) ? board.word : undefined

			let errorMessage = session.get("error") || undefined

			if (typeof errorMessage !== "string") {
				errorMessage = undefined
			}

			console.log({ board, showModal, showWord, errorMessage })

			return render(
				<GameBoard board={board} showModal={showModal} showWord={showWord} error={errorMessage} />,
			)
		},
	},
} satisfies Controller<typeof routes.frames>
