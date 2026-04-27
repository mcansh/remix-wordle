import { TaggedError } from "better-result"

import wordBank from "./word-bank.json"

export interface GameRules {
	wordLength: number
	maxGuesses: number
}

export const GAME_RULES = {
	wordLength: 5,
	maxGuesses: 6,
} as const satisfies GameRules

export const LetterState = {
	Blank: "Blank", // The letter is blank
	Miss: "Miss", // Letter doesn't exist at all
	Present: "Present", // Letter exists but wrong location
	Match: "Match", // Letter exists and is in the right location
} as const

export type LetterState = (typeof LetterState)[keyof typeof LetterState]

const GameCompleteError = TaggedError("GameCompleteError")<{}>()
const WrongLengthError = TaggedError("WrongLengthError")<{ length: number }>()
const InvalidWordError = TaggedError("InvalidWordError")<{ word: string }>()
const DuplicateGuessError = TaggedError("DuplicateGuessError")<{
	word: string
}>()
const UnknownGameError = TaggedError("UnknownGameError")<{ message: string }>()

export type GuessError =
	| InstanceType<typeof GameCompleteError>
	| InstanceType<typeof WrongLengthError>
	| InstanceType<typeof InvalidWordError>
	| InstanceType<typeof DuplicateGuessError>
	| InstanceType<typeof UnknownGameError>

export function gameCompleteError() {
	return new GameCompleteError({})
}
export function wrongLengthError(length: number) {
	return new WrongLengthError({ length })
}
export function invalidWordError(word: string) {
	return new InvalidWordError({ word })
}
export function duplicateGuessError(word: string) {
	return new DuplicateGuessError({ word })
}
export function unknownGameError(message: string) {
	return new UnknownGameError({ message })
}

export type ComputedGuess = {
	id: string
	letter: string
	state: LetterState
}

function genId() {
	return Math.random().toString(36).substring(2, 15)
}

export function createEmptyLetter() {
	return { id: genId(), state: LetterState.Blank, letter: "" }
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

export function computeGuess(
	guess: string,
	answer: string,
): Array<ComputedGuess> {
	if (guess.length !== answer.length) {
		return []
	}

	let result: Array<ComputedGuess> = []
	let answerLetters = [...segmenter.segment(answer)].map((s) => s.segment)
	let guessLetters = [...segmenter.segment(guess)].map((s) => s.segment)

	let answerLetterCount: Record<string, number> = {}
	for (let letter of answerLetters) {
		answerLetterCount[letter] = (answerLetterCount[letter] ?? 0) + 1
	}

	for (let [index, guessLetter] of guessLetters.entries()) {
		let answerLetter = answerLetters.at(index)
		if (!answerLetter) continue

		let id = genId()

		if (guessLetter === answerLetter) {
			result.push({ id, letter: guessLetter, state: LetterState.Match })
			answerLetterCount[guessLetter] = (answerLetterCount[guessLetter] ?? 0) - 1
		} else {
			result.push({ id, letter: guessLetter, state: LetterState.Present })
		}
	}

	for (let [index, item] of result.entries()) {
		if (item.state !== LetterState.Present) {
			continue
		}

		let letter = guessLetters.at(index)
		if (!letter) continue

		if ((answerLetterCount[letter] ?? 0) > 0) {
			answerLetterCount[letter] = (answerLetterCount[letter] ?? 0) - 1
		} else {
			item.state = LetterState.Miss
		}
	}

	return result
}

export function getRandomWord(): string {
	let validWords = wordBank.valid
	if (validWords.length === 0) throw new Error("No valid words available")
	let index = Math.floor(Math.random() * validWords.length)
	let word = validWords.at(index)
	if (!word) throw new Error("Failed to select a random word")
	return word
}

export function isValidWord(guess: string): boolean {
	return [...wordBank.valid, ...wordBank.invalid].includes(guess)
}

const KEYBOARD = [
	["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
	["a", "s", "d", "f", "g", "h", "j", "k", "l"],
	["z", "x", "c", "v", "b", "n", "m"],
] as const

export function keyboardWithStatus(
	guesses: Array<{ letters: Array<ComputedGuess> }>,
) {
	let letters = guesses
		.flatMap((guess) => guess.letters)
		.filter((guess) => guess.state !== LetterState.Blank)

	let states = new Map<string, LetterState>()

	// map letters to best state for each letter
	for (let letter of letters) {
		if (states.has(letter.letter)) {
			if (letter.state === LetterState.Match) {
				states.set(letter.letter, LetterState.Match)
			}

			continue
		}
		states.set(letter.letter, letter.state)
	}

	return KEYBOARD.map((row) => {
		return row.map((letter) => {
			return { letter, state: states.get(letter) || LetterState.Blank }
		})
	})
}
