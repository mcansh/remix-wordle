import type { Controller } from "remix/fetch-router"

import { requireAuth } from "../middleware/auth.ts"
import { getGame, isGameComplete } from "../models/game.ts"
import { routes } from "../routes.ts"
import { getCurrentUser } from "../utils/context.ts"
import { db } from "../utils/db.ts"
import { render } from "../utils/render.ts"
import { HistoricalGame } from "./game.tsx"
import {
	createHistoricalGameListItem,
	HISTORICAL_GAME_SELECT,
	HistoricalGameList,
} from "./history-page.tsx"
import { GameNotFound } from "./not-found-page.tsx"

export let history = {
	middleware: [requireAuth()],
	actions: {
		async index({ url }) {
			let user = getCurrentUser()

			let games = await db.game.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				select: HISTORICAL_GAME_SELECT,
			})

			let formattedGames = games.map((game) => {
				return createHistoricalGameListItem(game)
			})

			return render(<HistoricalGameList setup={{ url }} games={formattedGames} />)
		},

		async game({ params, url }) {
			let user = getCurrentUser()
			let game = await getGame({ ...params, userId: user.id })

			if (!game) {
				return render(<GameNotFound setup={{ url }} />, { status: 404 })
			}

			let showModal = isGameComplete(game.status)

			return render(<HistoricalGame setup={{ url }} game={game} showModal={showModal} />)
		},
	},
} satisfies Controller<typeof routes.history>
