import type { Controller } from "remix/fetch-router"

import { requireAuth } from "../../middleware/auth.ts"
import { getGameById, isGameComplete } from "../../models/game.ts"
import { routes } from "../../routes.ts"
import { getCurrentUser } from "../../utils/context.ts"
import { db } from "../../utils/db.ts"
import { render } from "../../utils/render.ts"
import { HistoricalGame } from "./game"
import {
	createHistoricalGameListItem,
	HISTORICAL_GAME_SELECT,
	HistoricalGameList,
} from "./history-page"
import { GameNotFound } from "./not-found-page"

export const history = {
	middleware: [requireAuth],
	actions: {
		async index(context) {
			let identity = getCurrentUser()

			let games = await db.game.findMany({
				where: { userId: identity.user.id },
				orderBy: { createdAt: "desc" },
				select: HISTORICAL_GAME_SELECT,
			})

			let formattedGames = games.map((game) => {
				return createHistoricalGameListItem(game)
			})

			return render(
				<HistoricalGameList url={context.url} games={formattedGames} />,
			)
		},

		async game(context) {
			let game = await getGameById(context.params.id)

			if (!game) {
				return render(<GameNotFound url={context.url} />, {
					status: 404,
				})
			}

			let showModal = isGameComplete(game.status)

			return render(
				<HistoricalGame url={context.url} game={game} showModal={showModal} />,
			)
		},
	},
} satisfies Controller<typeof routes.history>
