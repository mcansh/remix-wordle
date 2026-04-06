import wordBank from "./word-bank.json"

export const LetterState = {
	Blank: "Blank", // The letter is blank
	Miss: "Miss", // Letter doesn't exist at all
	Present: "Present", // Letter exists but wrong location
	Match: "Match", // Letter exists and is in the right location
} as const

type LetterState = (typeof LetterState)[keyof typeof LetterState]

export type ComputedGuess = {
	id: string
	letter: string
	state: LetterState
}

export function genId() {
	return Math.random().toString(36).substring(2, 15)
}

export function createEmptyLetter() {
	return { id: genId(), state: LetterState.Blank, letter: "" }
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })

export function computeGuess(guess: string, answer: string): Array<ComputedGuess> {
	if (guess.length !== answer.length) {
		return []
	}

	let result: Array<ComputedGuess> = []
	let answerLetters = [...segmenter.segment(answer)].map((s) => s.segment)
	let guessLetters = [...segmenter.segment(guess)].map((s) => s.segment)

	let answerLetterCount: Record<string, number> = {}
	for (const letter of answerLetters) {
		answerLetterCount[letter] = (answerLetterCount[letter] ?? 0) + 1
	}

	for (const [index, guessLetter] of guessLetters.entries()) {
		const answerLetter = answerLetters.at(index)
		if (!answerLetter) continue

		const id = genId()

		if (guessLetter === answerLetter) {
			result.push({ id, letter: guessLetter, state: LetterState.Match })
			answerLetterCount[guessLetter] = (answerLetterCount[guessLetter] ?? 0) - 1
		} else {
			result.push({ id, letter: guessLetter, state: LetterState.Present })
		}
	}

	for (const [index, item] of result.entries()) {
		if (item.state !== LetterState.Present) {
			continue
		}

		const letter = guessLetters.at(index)
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
	const validWords = wordBank.valid
	if (validWords.length === 0) throw new Error("No valid words available")
	const index = Math.floor(Math.random() * validWords.length)
	const word = validWords.at(index)
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

export function keyboardWithStatus(guesses: Array<{ letters: Array<ComputedGuess> }>) {
	let letters = guesses
		.flatMap((guess) => guess.letters)
		.filter((guess) => guess.state !== LetterState.Blank)

	// map letters to best state for each letter
	let states = new Map<string, LetterState>(
		letters.reduce((acc, letter) => {
			if (acc.has(letter.letter)) {
				let current = acc.get(letter.letter)
				if (current === LetterState.Match) {
					return acc
				}

				if (letter.state === LetterState.Match) {
					acc.set(letter.letter, LetterState.Match)
				}
			} else {
				acc.set(letter.letter, letter.state)
			}

			return acc
		}, new Map<string, LetterState>()),
	)

	return KEYBOARD.map((row) => {
		return row.map((letter) => {
			return { letter, state: states.get(letter) || LetterState.Blank }
		})
	})
}
