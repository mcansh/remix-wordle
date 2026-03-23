import type { Controller } from "remix/fetch-router"

import { db } from "../db.ts"
import type { Prisma } from "../generated/prisma/client.ts"
import { requireAuth } from "../middleware/auth.ts"
import { getGameById, isGameComplete } from "../models/game.ts"
import { routes } from "../routes.ts"
import { getCurrentUser } from "../utils/context.ts"
import { renderDocument } from "../utils/render.tsx"
import { GamePage, NoGameFoundPage } from "./game-page.tsx"
import { HistoryListPage } from "./history-page.tsx"

let shortDateFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "short",
})

let HISTORY_GAME_SELECT = {
	id: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { guesses: true } },
	status: true,
	word: true,
} satisfies Prisma.GameSelect

type HISTORY_GAME = Prisma.GameGetPayload<{ select: typeof HISTORY_GAME_SELECT }>

export function createHistoricalGame(game: HISTORY_GAME) {
	let createdAt = new Date(game.createdAt)
	let updatedAt = new Date(game.updatedAt)
	let date = updatedAt > createdAt ? updatedAt : createdAt
	return {
		id: game.id,
		date: shortDateFormatter.format(date),
		guesses: game._count.guesses,
		status: game.status,
		word: game.word,
	}
}

export let history = {
	middleware: [requireAuth()],
	actions: {
		async index() {
			let user = getCurrentUser()

			let games = await db.game.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				select: HISTORY_GAME_SELECT,
			})

			let formattedGames = games.map((game) => {
				return createHistoricalGame(game)
			})

			return renderDocument(<HistoryListPage games={formattedGames} />)
		},

		async game({ params }) {
			let game = await getGameById(params.id)

			if (!game) {
				return renderDocument(<NoGameFoundPage />, { status: 404 })
			}

			let showModal = isGameComplete(game.status)

			return renderDocument(<GamePage game={game} showModal={showModal} />)
		},
	},
} satisfies Controller<typeof routes.history>
