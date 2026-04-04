import { clsx } from "clsx"
import type { Handle } from "remix/component"

import { Document } from "../components/document"
import { GameOverModal } from "../components/game-over-modal"
import { Keyboard } from "../components/keyboard"
import { TOTAL_GUESSES } from "../constants"
import type { GameBoard } from "../models/game"
import { LetterState } from "../utils/game"

export function HistoricalGame(_handle: Handle, { url }: { url: URL }) {
	return ({ game, showModal }: { game: GameBoard; showModal: boolean }) => {
		return (
			<Document url={url} head={<title>Remix Wordle - Game {game.id}</title>}>
				{showModal ? (
					<GameOverModal
						currentGuess={game.currentGuess}
						guesses={game.guesses}
						totalGuesses={TOTAL_GUESSES}
						winner={game.status === "WON"}
						word={"word" in game ? game.word : ""}
					/>
				) : null}

				<div class="mx-auto h-full max-w-sm">
					<header>
						<h1 class="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
					</header>

					<main>
						<div class="space-y-4">
							{game.guesses.map((guess, guessIndex) => {
								return (
									<div key={`guess-number-${guessIndex}`} class="grid grid-cols-5 gap-4">
										{guess.letters.map((letter) => {
											return (
												<input
													key={`guess-${guessIndex}-letter-${letter.id}`}
													readOnly
													class={clsx(
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

							<Keyboard board={game.keyboardWithStatus} />
						</div>
					</main>
				</div>
			</Document>
		)
	}
}
