import { describe, it, expect } from "vitest"

import {
	computeGuess,
	createEmptyLetter,
	getRandomWord,
	isValidWord,
	keyboardWithStatus,
	LetterState,
	type ComputedGuess,
} from "./game"

describe("computeGuess", () => {
	it("works with match and presents", () => {
		expect(computeGuess("boost", "basic")).toEqual([
			expect.objectContaining({ letter: "b", state: LetterState.Match }),
			expect.objectContaining({ letter: "o", state: LetterState.Miss }),
			expect.objectContaining({ letter: "o", state: LetterState.Miss }),
			expect.objectContaining({ letter: "s", state: LetterState.Present }),
			expect.objectContaining({ letter: "t", state: LetterState.Miss }),
		])
	})

	it("full match", () => {
		expect(computeGuess("boost", "boost")).toEqual([
			expect.objectContaining({ letter: "b", state: LetterState.Match }),
			expect.objectContaining({ letter: "o", state: LetterState.Match }),
			expect.objectContaining({ letter: "o", state: LetterState.Match }),
			expect.objectContaining({ letter: "s", state: LetterState.Match }),
			expect.objectContaining({ letter: "t", state: LetterState.Match }),
		])
	})

	it("full miss", () => {
		expect(computeGuess("guard", "boost")).toEqual([
			expect.objectContaining({ letter: "g", state: LetterState.Miss }),
			expect.objectContaining({ letter: "u", state: LetterState.Miss }),
			expect.objectContaining({ letter: "a", state: LetterState.Miss }),
			expect.objectContaining({ letter: "r", state: LetterState.Miss }),
			expect.objectContaining({ letter: "d", state: LetterState.Miss }),
		])
	})

	it("only does one match when two letters exist", () => {
		expect(computeGuess("solid", "boost")).toEqual([
			expect.objectContaining({ letter: "s", state: LetterState.Present }),
			expect.objectContaining({ letter: "o", state: LetterState.Match }),
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
			expect.objectContaining({ letter: "i", state: LetterState.Miss }),
			expect.objectContaining({ letter: "d", state: LetterState.Miss }),
		])
	})

	it("returns empty array when given incomplete guess", () => {
		expect(computeGuess("so", "boost")).toEqual([])
	})

	it("when 2 letters are present but answer has only 1 of those letters", () => {
		expect(computeGuess("allol", "smelt")).toEqual([
			expect.objectContaining({ letter: "a", state: LetterState.Miss }),
			expect.objectContaining({ letter: "l", state: LetterState.Present }),
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
			expect.objectContaining({ letter: "o", state: LetterState.Miss }),
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
		])
	})

	it("when 1 letter matches but guess has more of the same letter", () => {
		expect(computeGuess("allol", "colon")).toEqual([
			expect.objectContaining({ letter: "a", state: LetterState.Miss }),
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
			expect.objectContaining({ letter: "l", state: LetterState.Match }),
			expect.objectContaining({ letter: "o", state: LetterState.Match }),
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
		])
	})
})

describe("isValidWord", () => {
	it("with valid word", () => {
		expect(isValidWord("boost")).toBe(true)
	})

	it("with invalid word", () => {
		expect(isValidWord("lulze")).toBe(false)
	})
})

describe("getRandomWord", () => {
	it("returns a string", () => {
		const word = getRandomWord()
		expect(typeof word).toBe("string")
	})

	it("returns a word of expected length", () => {
		const word = getRandomWord()
		expect(word.length).toBeGreaterThan(0)
	})

	it("returns different words on multiple calls (probabilistic)", () => {
		const words = new Set()
		// Generate 100 words - very likely to get at least 2 different ones
		for (let i = 0; i < 100; i++) {
			words.add(getRandomWord())
		}
		expect(words.size).toBeGreaterThan(1)
	})

	it("returns a valid word from the word bank", () => {
		const word = getRandomWord()
		expect(isValidWord(word)).toBe(true)
	})
})

describe("createEmptyLetter", () => {
	it("creates a letter with Blank state", () => {
		const letter = createEmptyLetter()
		expect(letter.state).toBe(LetterState.Blank)
	})

	it("creates a letter with empty string", () => {
		const letter = createEmptyLetter()
		expect(letter.letter).toBe("")
	})

	it("creates a letter with a unique id", () => {
		const letter1 = createEmptyLetter()
		const letter2 = createEmptyLetter()
		expect(letter1.id).toBeTruthy()
		expect(letter2.id).toBeTruthy()
		expect(letter1.id).not.toBe(letter2.id)
	})

	it("generates different ids for multiple calls", () => {
		const ids = new Set()
		for (let i = 0; i < 10; i++) {
			ids.add(createEmptyLetter().id)
		}
		expect(ids.size).toBe(10)
	})
})

describe("keyboardWithStatus", () => {
	it("returns keyboard with all blank states for no guesses", () => {
		const guesses: Array<{ letters: Array<ComputedGuess> }> = []
		const keyboard = keyboardWithStatus(guesses)

		expect(keyboard).toHaveLength(3) // Three rows
		keyboard.forEach((row) => {
			row.forEach((key) => {
				expect(key.state).toBe(LetterState.Blank)
			})
		})
	})

	it("marks correctly guessed letters as Match", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "h", state: LetterState.Match },
					{ id: "2", letter: "e", state: LetterState.Miss },
					{ id: "3", letter: "l", state: LetterState.Miss },
					{ id: "4", letter: "l", state: LetterState.Miss },
					{ id: "5", letter: "o", state: LetterState.Miss },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		const hKey = keyboard.flat().find((k) => k.letter === "h")
		expect(hKey?.state).toBe(LetterState.Match)
	})

	it("marks present letters as Present", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "t", state: LetterState.Present },
					{ id: "2", letter: "e", state: LetterState.Miss },
					{ id: "3", letter: "s", state: LetterState.Miss },
					{ id: "4", letter: "t", state: LetterState.Miss },
					{ id: "5", letter: "s", state: LetterState.Miss },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		const tKey = keyboard.flat().find((k) => k.letter === "t")
		expect(tKey?.state).toBe(LetterState.Present)
	})

	it("prioritizes Match over Present for same letter", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "a", state: LetterState.Present },
					{ id: "2", letter: "b", state: LetterState.Miss },
					{ id: "3", letter: "c", state: LetterState.Miss },
					{ id: "4", letter: "d", state: LetterState.Miss },
					{ id: "5", letter: "e", state: LetterState.Miss },
				],
			},
			{
				letters: [
					{ id: "6", letter: "a", state: LetterState.Match },
					{ id: "7", letter: "f", state: LetterState.Miss },
					{ id: "8", letter: "g", state: LetterState.Miss },
					{ id: "9", letter: "h", state: LetterState.Miss },
					{ id: "10", letter: "i", state: LetterState.Miss },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		const aKey = keyboard.flat().find((k) => k.letter === "a")
		expect(aKey?.state).toBe(LetterState.Match)
	})

	it("marks missed letters as Miss", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "x", state: LetterState.Miss },
					{ id: "2", letter: "y", state: LetterState.Miss },
					{ id: "3", letter: "z", state: LetterState.Miss },
					{ id: "4", letter: "q", state: LetterState.Miss },
					{ id: "5", letter: "w", state: LetterState.Miss },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		const xKey = keyboard.flat().find((k) => k.letter === "x")
		const yKey = keyboard.flat().find((k) => k.letter === "y")
		const zKey = keyboard.flat().find((k) => k.letter === "z")

		expect(xKey?.state).toBe(LetterState.Miss)
		expect(yKey?.state).toBe(LetterState.Miss)
		expect(zKey?.state).toBe(LetterState.Miss)
	})

	it("ignores blank letter states", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "", state: LetterState.Blank },
					{ id: "2", letter: "", state: LetterState.Blank },
					{ id: "3", letter: "", state: LetterState.Blank },
					{ id: "4", letter: "", state: LetterState.Blank },
					{ id: "5", letter: "", state: LetterState.Blank },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		keyboard.forEach((row) => {
			row.forEach((key) => {
				expect(key.state).toBe(LetterState.Blank)
			})
		})
	})

	it("handles multiple guesses with mixed states", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "s", state: LetterState.Present },
					{ id: "2", letter: "t", state: LetterState.Miss },
					{ id: "3", letter: "a", state: LetterState.Miss },
					{ id: "4", letter: "r", state: LetterState.Present },
					{ id: "5", letter: "e", state: LetterState.Miss },
				],
			},
			{
				letters: [
					{ id: "6", letter: "s", state: LetterState.Match },
					{ id: "7", letter: "h", state: LetterState.Match },
					{ id: "8", letter: "a", state: LetterState.Match },
					{ id: "9", letter: "r", state: LetterState.Match },
					{ id: "10", letter: "d", state: LetterState.Match },
				],
			},
		]

		const keyboard = keyboardWithStatus(guesses)
		const sKey = keyboard.flat().find((k) => k.letter === "s")
		const hKey = keyboard.flat().find((k) => k.letter === "h")
		const aKey = keyboard.flat().find((k) => k.letter === "a")
		const rKey = keyboard.flat().find((k) => k.letter === "r")
		const tKey = keyboard.flat().find((k) => k.letter === "t")
		const eKey = keyboard.flat().find((k) => k.letter === "e")

		expect(sKey?.state).toBe(LetterState.Match) // Upgraded from Present to Match
		expect(hKey?.state).toBe(LetterState.Match)
		expect(aKey?.state).toBe(LetterState.Match) // Upgraded from Miss to Match
		expect(rKey?.state).toBe(LetterState.Match) // Upgraded from Present to Match
		expect(tKey?.state).toBe(LetterState.Miss)
		expect(eKey?.state).toBe(LetterState.Miss)
	})

	it("returns correct keyboard structure (3 rows with specific letters)", () => {
		const guesses: Array<{ letters: Array<ComputedGuess> }> = []
		const keyboard = keyboardWithStatus(guesses)

		let [row1, row2, row3] = keyboard

		if (!row1 || !row2 || !row3) {
			throw new Error("Keyboard rows are not properly defined")
		}

		// First row
		expect(row1).toHaveLength(10)
		expect(row1.map((k) => k.letter)).toEqual(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"])

		// Second row
		expect(row2).toHaveLength(9)
		expect(row2.map((k) => k.letter)).toEqual(["a", "s", "d", "f", "g", "h", "j", "k", "l"])

		// Third row
		expect(row3).toHaveLength(7)
		expect(row3.map((k) => k.letter)).toEqual(["z", "x", "c", "v", "b", "n", "m"])
	})
})

// Additional edge cases for computeGuess
describe("computeGuess - additional edge cases", () => {
	it("handles empty strings", () => {
		expect(computeGuess("", "")).toEqual([])
	})

	it("handles single character words", () => {
		expect(computeGuess("a", "a")).toEqual([
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
		])
	})

	it("handles all same letter in guess and answer", () => {
		expect(computeGuess("aaaaa", "aaaaa")).toEqual([
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
			expect.objectContaining({ letter: "a", state: LetterState.Match }),
		])
	})

	it("handles guess longer than answer", () => {
		expect(computeGuess("toolong", "short")).toEqual([])
	})

	it("handles answer longer than guess", () => {
		expect(computeGuess("short", "toolong")).toEqual([])
	})

	it("complex letter counting with 3 of same letter", () => {
		expect(computeGuess("lolly", "hello")).toEqual([
			expect.objectContaining({ letter: "l", state: LetterState.Miss }),
			expect.objectContaining({ letter: "o", state: LetterState.Present }),
			expect.objectContaining({ letter: "l", state: LetterState.Match }),
			expect.objectContaining({ letter: "l", state: LetterState.Match }),
			expect.objectContaining({ letter: "y", state: LetterState.Miss }),
		])
	})

	it("generates unique IDs for each letter", () => {
		const result = computeGuess("hello", "world")
		const ids = result.map((r) => r.id)
		const uniqueIds = new Set(ids)
		expect(uniqueIds.size).toBe(ids.length)
	})
})
