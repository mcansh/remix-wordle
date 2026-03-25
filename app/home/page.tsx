import { clsx } from "clsx"
import type { Handle } from "remix/component"

import { Document } from "../components/document"
import { GuessForm } from "../components/form"
import { GameOverModal } from "../components/game-over-modal"
import { LetterInput } from "../components/letter-input"
import { LETTER_INPUTS, TOTAL_GUESSES } from "../constants"
import type { GameBoard } from "../models/game"

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
										<GuessForm currentGuess={board.currentGuess}>
											{showWord ? <input type="hidden" name="cheat" value="true" /> : null}
											{LETTER_INPUTS.map((index) => (
												<LetterInput
													key={`input-number-${index}`}
													index={index}
													errorMessage={error}
												/>
											))}
										</GuessForm>
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
								class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
								value="Submit Guess"
							/>
						</div>

						<div class="mx-auto max-w-md pt-10">
							{board.keyboardWithStatus.map((row, index) => {
								let letters = row.map((letter) => letter.letter).join("")
								return (
									<div
										key={`keyboard-row-${letters}`}
										class={clsx("flex justify-center gap-2", { "mt-2": index > 0 })}
									>
										{row.map((letter) => {
											return (
												<div
													data-state={letter.state}
													class={`flex size-10 items-center justify-center rounded text-center text-white uppercase data-[state=Blank]:bg-gray-400 data-[state=Match]:bg-green-500 data-[state=Miss]:bg-red-500 data-[state=Present]:bg-yellow-500`}
													key={`keyboard-letter-${letter.letter}`}
												>
													{letter.letter}
												</div>
											)
										})}
									</div>
								)
							})}
						</div>
					</main>
				</div>
			</Document>
		)
	}
}
