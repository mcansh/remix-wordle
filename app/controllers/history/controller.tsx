import { Auth, type BadAuth, type GoodAuth } from "remix/auth-middleware"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"

import { getReturnToQuery, requireAuth } from "../../middleware/auth.ts"
import { getGameById, isGameComplete } from "../../models/game.ts"
import { routes } from "../../routes.ts"
import type { AuthIdentity } from "../../utils/auth-session.ts"
import { db } from "../../utils/db.ts"
import { render } from "../../utils/render.ts"
import { HistoricalGame } from "./game.tsx"
import {
	createHistoricalGameListItem,
	HISTORICAL_GAME_SELECT,
	HistoricalGameList,
} from "./history-page.tsx"
import { GameNotFound } from "./not-found-page.tsx"

export let history = {
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

			return render(<HistoricalGameList setup={{ url: context.url }} games={formattedGames} />)
		},

		async game({ params, url }) {
			let game = await getGameById(params.id)

			if (!game) {
				return render(<GameNotFound setup={{ url }} />, { status: 404 })
			}

			let showModal = isGameComplete(game.status)

			return render(<HistoricalGame setup={{ url }} game={game} showModal={showModal} />)
		},
	},
} satisfies Controller<typeof routes.history>
