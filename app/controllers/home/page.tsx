import type { Handle } from "remix/component"

import { Document } from "#app/components/document.tsx"
import { GuessForm } from "#app/components/form.tsx"
import { GameOverModal } from "#app/components/game-over-modal.tsx"
import { Keyboard } from "#app/components/keyboard.tsx"
import { TOTAL_GUESSES } from "#app/constants.ts"
import type { GameBoard } from "#app/models/game.ts"

export function Page(_handle: Handle, { url }: { url: URL }) {
	return ({
		showModal,
		showWord,
		board,
		error,
	}: {
		showModal: boolean
		showWord?: string
		board: GameBoard
		error?: string
	}) => {
		return (
			<Document url={url} head={<title>Remix Wordle</title>}>
				{showModal ? (
					<GameOverModal
						currentGuess={board.currentGuess}
						guesses={board.guesses}
						totalGuesses={TOTAL_GUESSES}
						winner={board.status === "WON"}
						word={board.word || ""}
					/>
				) : null}

				<div class="h-full" aria-hidden={showModal ? true : undefined}>
					<header>
						<h1 class="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
						{!showModal && showWord ? (
							<h2 class="mb-4 text-center text-sm text-gray-700">Your word is {showWord}</h2>
						) : null}
					</header>

					<main>
						{error ? <div class="mb-4 text-center text-red-500">{error}</div> : null}
						<div class="mx-auto max-w-sm space-y-4">
							{board.guesses.map((guess, guessIndex) => {
								if (board.currentGuess === guessIndex) {
									return (
										<GuessForm currentGuess={board.currentGuess} error={error} cheat={!!showWord} />
									)
								}

								return (
									<div key={`guess-number-${guessIndex}`} class="grid grid-cols-5 gap-4">
										{guess.letters.map((letter) => {
											return (
												<input
													key={`guess-${guessIndex}-letter-${letter.id}`}
													readOnly
													data-state={letter.state}
													class={`inline-block aspect-square w-full border-4 text-center text-xl text-white uppercase data-[state=Blank]:border-gray-400 data-[state=Match]:border-green-500 data-[state=Match]:bg-green-500 data-[state=Miss]:border-red-500 data-[state=Miss]:bg-red-500 data-[state=Present]:border-yellow-500 data-[state=Present]:bg-yellow-500`}
													value={letter.letter}
													type="text"
													pattern="[a-zA-Z]{1}"
													maxLength={1}
													tabIndex={-1}
													name="letter"
													aria-label={`letter ${guessIndex + 1}`}
												/>
											)
										})}
									</div>
								)
							})}

							<input
								enterKeyHint="send"
								form="current-guess"
								type="submit"
								class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
								value="Submit Guess"
							/>
						</div>

						<Keyboard board={board.keyboardWithStatus} />
					</main>
				</div>
			</Document>
		)
	}
}
