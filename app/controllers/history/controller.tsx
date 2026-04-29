import { Auth, type BadAuth, type GoodAuth } from "remix/auth-middleware"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"

import { getReturnToQuery, requireAuth } from "#app/middleware/auth.ts"
import { getGameById, isGameComplete } from "#app/models/game.ts"
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
				return redirect(routes.auth.login.index.href(undefined, getReturnToQuery(context.url)))
			}

			let games = await db.game.findMany({
				where: { userId: auth.identity.user.id },
				orderBy: { createdAt: "desc" },
				select: HISTORICAL_GAME_SELECT,
			})

			let formattedGames = games.map((game) => {
				return createHistoricalGameListItem(game)
			})

			return render(<HistoricalGameList url={context.url} games={formattedGames} />)
		},

		async game(context) {
			let game = await getGameById(context.params.id)

			if (!game) {
				return render(<GameNotFound url={context.url} />, { status: 404 })
			}

			let showModal = isGameComplete(game.status)

			return render(<HistoricalGame url={context.url} game={game} showModal={showModal} />)
		},
	},
} satisfies Controller<typeof routes.history>
