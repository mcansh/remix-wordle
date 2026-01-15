import type { Controller } from "@remix-run/fetch-router"

import clsx from "clsx"

import { Document } from "./components/document.tsx"
import { GameOverModal } from "./components/game-over-modal.tsx"
import { TOTAL_GUESSES } from "./constants.ts"
import { db } from "./db.ts"
import { requireAuth } from "./middleware/auth.ts"
import { getGameById, isGameComplete } from "./models/game.ts"
import { routes } from "./routes.ts"
import { getCurrentUser } from "./utils/context.ts"
import { LetterState } from "./utils/game.ts"
import { render } from "./utils/render.ts"

export let history = {
	middleware: [requireAuth()],
	actions: {
		async index() {
			let user = getCurrentUser()

			let games = await db.game.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					createdAt: true,
					updatedAt: true,
					_count: { select: { guesses: true } },
					status: true,
					word: true,
				},
			})

			let formatter = new Intl.DateTimeFormat("en-US", {
				dateStyle: "short",
			})

			let formattedGames = games.map((game) => {
				let createdAt = new Date(game.createdAt)
				let updatedAt = new Date(game.updatedAt)
				let date = updatedAt > createdAt ? updatedAt : createdAt
				return {
					id: game.id,
					date: formatter.format(date),
					guesses: game._count.guesses,
					status: game.status,
					word: game.word,
				}
			})

			return render(
				<Document>
					<title>Remix Wordle Game History</title>
					<div className="px-4 pt-8 sm:px-6 lg:px-8">
						<div className="sm:flex sm:items-center">
							<div className="sm:flex-auto">
								<h1 className="text-base leading-6 font-semibold text-gray-900">History</h1>
								<p className="mt-2 text-sm text-gray-700">A history of all of your games.</p>
							</div>
						</div>
						<div className="mt-8 flow-root">
							<div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
								<div className="inline-block min-w-full py-2 align-middle">
									<table className="min-w-full border-separate border-spacing-0 lg:px-6">
										<thead>
											<tr>
												<th
													scope="col"
													className="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8"
												>
													Date
												</th>
												<th
													scope="col"
													className="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell"
												>
													Word
												</th>
												<th
													scope="col"
													className="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
												>
													Guesses
												</th>
												<th
													scope="col"
													className="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
												>
													Status
												</th>
												<th
													scope="col"
													className="bg-opacity-75 sticky top-0 z-10 border-b border-gray-300 bg-white py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8"
												>
													<span className="sr-only">Edit</span>
												</th>
											</tr>
										</thead>
										<tbody>
											{formattedGames.map((game, gameIndex, array) => (
												<tr key={game.id}>
													<td
														className={clsx(
															gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
															"py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 lg:pl-8",
														)}
													>
														{game.date}
													</td>
													<td
														className={clsx(
															gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
															"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
														)}
													>
														{game.word}
													</td>
													<td
														className={clsx(
															gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
															"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
														)}
													>
														{game.guesses}
													</td>
													<td
														className={clsx(
															gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
															"px-3 py-4 text-sm whitespace-nowrap text-gray-500",
														)}
													>
														{game.status}
													</td>
													<td
														className={clsx(
															gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
															"relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-8 lg:pr-8",
														)}
													>
														<a
															href={routes.history.game.href({ id: game.id })}
															className="text-indigo-600 hover:text-indigo-900"
														>
															View<span className="sr-only">, {game.word}</span>
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
				</Document>,
			)
		},

		async game({ params }) {
			let game = await getGameById(params.id)

			if (!game) {
				return render(
					<Document>
						<title>Remix Wordle - Game Not Found</title>
						<div className="mx-auto h-full max-w-sm">
							<header>
								<h1 className="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
							</header>

							<main>
								<div className="">
									<h2 className="">Game Not Found</h2>
									<p className="">The game you are looking for does not exist.</p>
								</div>
							</main>
						</div>
					</Document>,
					{ status: 404 },
				)
			}

			let showModal = isGameComplete(game.status)

			return render(
				<Document>
					<title>Remix Wordle - Game {game.id}</title>
					{showModal ? (
						<GameOverModal
							currentGuess={game.currentGuess}
							guesses={game.guesses}
							totalGuesses={TOTAL_GUESSES}
							winner={game.status === "WON"}
							word={"word" in game ? game.word : ""}
						/>
					) : null}

					<div className="mx-auto h-full max-w-sm">
						<header>
							<h1 className="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
						</header>

						<main>
							<div className="space-y-4">
								{game.guesses.map((guess, guessIndex) => {
									return (
										<div key={`guess-number-${guessIndex}`} className="grid grid-cols-5 gap-4">
											{guess.letters.map((letter) => {
												return (
													<input
														key={`guess-${guessIndex}-letter-${letter.id}`}
														readOnly
														className={clsx(
															"inline-block aspect-square w-full border-4 text-center text-xl uppercase",
															{
																"border-green-500 bg-green-500 text-white":
																	letter.state === LetterState.Match,
																"border-red-500 bg-red-500 text-white":
																	letter.state === LetterState.Miss,
																"border-yellow-500 bg-yellow-500 text-white":
																	letter.state === LetterState.Present,
																"border-gray-400 text-white": letter.state === LetterState.Blank,
															},
														)}
														value={letter.letter}
														type="text"
														pattern="[a-zA-Z]{1}"
														maxLength={1}
														name="letter"
														aria-label={`letter ${guessIndex + 1}`}
													/>
												)
											})}
										</div>
									)
								})}

								<input
									form="current-guess"
									enterKeyHint="send"
									type="submit"
									className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
									value="Submit Guess"
								/>
							</div>
						</main>
					</div>
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.history>
