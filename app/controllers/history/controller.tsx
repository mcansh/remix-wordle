import { Auth, type BadAuth, type GoodAuth } from "remix/middleware/auth"
import { redirect } from "remix/response/redirect"
import type { Controller } from "remix/router"

import { getReturnToQuery, requireAuth } from "#app/middleware/auth.ts"
import { getGameById, getTodayRange, isGameComplete } from "#app/models/game.ts"
import { routes } from "#app/routes.ts"
import type { AuthIdentity } from "#app/utils/auth-session.ts"
import { db } from "#app/utils/db.ts"
import { render } from "#app/utils/render.ts"

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
			let auth = context.get(Auth) as GoodAuth<AuthIdentity> | BadAuth
			if (auth.ok === false) {
				return redirect(
					routes.auth.login.index.href(undefined, { searchParams: getReturnToQuery(context.url) }),
				)
			}

			let games = await db.game.findMany({
				where: { userId: auth.identity.user.id },
				orderBy: { createdAt: "desc" },
				select: HISTORICAL_GAME_SELECT,
			})

			let { start, end } = getTodayRange(new Date())

			let formattedGames = games.map((game) => {
				let historicalGame = createHistoricalGameListItem(game)
				let isTodaysGame = game.createdAt >= start && game.createdAt <= end
				if (isTodaysGame && !isGameComplete(game.status)) {
					return { ...historicalGame, word: "" }
				}

				return historicalGame
			})

			return render(<HistoricalGameList url={context.url} games={formattedGames} />)
		},

		async game(context) {
			let gameResult = await getGameById(context.params.id)

			if (gameResult.isErr()) {
				return render(<GameNotFound url={context.url} />, { status: 404 })
			}

			let game = gameResult.value

			let showModal = isGameComplete(game.status)

			return render(<HistoricalGame url={context.url} game={game} showModal={showModal} />)
		},
	},
} satisfies Controller<typeof routes.history>
