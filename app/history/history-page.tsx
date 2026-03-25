import { clsx } from "clsx"
import type { Handle } from "remix/component"

import { Document } from "../components/document"
import type { Prisma } from "../generated/prisma/client"
import { routes } from "../routes"

let shortDateFormatter = new Intl.DateTimeFormat("en-US", {
	dateStyle: "short",
})

export let HISTORICAL_GAME_SELECT = {
	id: true,
	createdAt: true,
	updatedAt: true,
	_count: { select: { guesses: true } },
	status: true,
	word: true,
} satisfies Prisma.GameSelect

export type HistoricalGame = Prisma.GameGetPayload<{ select: typeof HISTORICAL_GAME_SELECT }>

export function createHistoricalGameListItem(game: HistoricalGame) {
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

export function HistoricalGameList(_handle: Handle, { url }: { url: URL }) {
	return ({ games }: { games: Array<ReturnType<typeof createHistoricalGameListItem>> }) => {
		return (
			<Document url={url} head={<title>Remix Wordle Game History</title>}>
				<div class="px-4 pt-8 sm:px-6 lg:px-8">
					<div class="sm:flex sm:items-center">
						<div class="sm:flex-auto">
							<h1 class="text-base leading-6 font-semibold text-gray-900">History</h1>
							<p class="mt-2 text-sm text-gray-700">A history of all of your games.</p>
						</div>
					</div>
					<div class="mt-8 flow-root">
						<div class="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
							<div class="inline-block min-w-full py-2 align-middle">
								<table class="min-w-full border-separate border-spacing-0 lg:px-6">
									<thead>
										<tr>
											<th
												scope="col"
												class="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
											>
												Date
											</th>
											<th
												scope="col"
												class="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell"
											>
												Word
											</th>
											<th
												scope="col"
												class="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
											>
												Guesses
											</th>
											<th
												scope="col"
												class="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
											>
												Status
											</th>
											<th
												scope="col"
												class="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8"
											>
												<span class="sr-only">Edit</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{games.map((game, gameIndex, array) => (
											<tr key={game.id}>
												<td
													class={clsx(
														gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
														"py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 lg:pl-8",
													)}
												>
													{game.date}
												</td>
												<td
													class={clsx(
														gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
														"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
													)}
												>
													{game.word}
												</td>
												<td
													class={clsx(
														gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
														"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
													)}
												>
													{game.guesses}
												</td>
												<td
													class={clsx(
														gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
														"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
													)}
												>
													{game.status}
												</td>
												<td
													class={clsx(
														gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
														"relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-8 lg:pr-8",
													)}
												>
													<a
														href={routes.history.game.href({ id: game.id })}
														class="text-indigo-600 hover:text-indigo-900"
													>
														View<span class="sr-only">, {game.word}</span>
													</a>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</Document>
		)
	}
}
