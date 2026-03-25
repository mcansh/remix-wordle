import { describe, it, expect } from "vite-plus/test"

import { boardToEmoji } from "./board-to-emoji"
import type { ComputedGuess } from "./game"
import { LetterState } from "./game"

describe("boardToEmoji", () => {
	it("converts all Match states to green squares", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "t", state: LetterState.Match },
					{ id: "2", letter: "e", state: LetterState.Match },
					{ id: "3", letter: "s", state: LetterState.Match },
					{ id: "4", letter: "t", state: LetterState.Match },
					{ id: "5", letter: "s", state: LetterState.Match },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟩 🟩 🟩 🟩 🟩")
	})

	it("converts all Miss states to red squares", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "w", state: LetterState.Miss },
					{ id: "2", letter: "r", state: LetterState.Miss },
					{ id: "3", letter: "o", state: LetterState.Miss },
					{ id: "4", letter: "n", state: LetterState.Miss },
					{ id: "5", letter: "g", state: LetterState.Miss },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟥 🟥 🟥 🟥 🟥")
	})

	it("converts all Present states to yellow squares", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "c", state: LetterState.Present },
					{ id: "2", letter: "l", state: LetterState.Present },
					{ id: "3", letter: "o", state: LetterState.Present },
					{ id: "4", letter: "s", state: LetterState.Present },
					{ id: "5", letter: "e", state: LetterState.Present },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟨 🟨 🟨 🟨 🟨")
	})

	it("converts all Blank states to white squares", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "", state: LetterState.Blank },
					{ id: "2", letter: "", state: LetterState.Blank },
					{ id: "3", letter: "", state: LetterState.Blank },
					{ id: "4", letter: "", state: LetterState.Blank },
					{ id: "5", letter: "", state: LetterState.Blank },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("⬜️ ⬜️ ⬜️ ⬜️ ⬜️")
	})

	it("handles mixed letter states correctly", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "b", state: LetterState.Match },
					{ id: "2", letter: "o", state: LetterState.Miss },
					{ id: "3", letter: "a", state: LetterState.Present },
					{ id: "4", letter: "r", state: LetterState.Miss },
					{ id: "5", letter: "d", state: LetterState.Match },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟩 🟥 🟨 🟥 🟩")
	})

	it("handles multiple rows with newline separation", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "f", state: LetterState.Miss },
					{ id: "2", letter: "i", state: LetterState.Present },
					{ id: "3", letter: "r", state: LetterState.Miss },
					{ id: "4", letter: "s", state: LetterState.Match },
					{ id: "5", letter: "t", state: LetterState.Miss },
				] satisfies Array<ComputedGuess>,
			},
			{
				letters: [
					{ id: "6", letter: "s", state: LetterState.Match },
					{ id: "7", letter: "e", state: LetterState.Match },
					{ id: "8", letter: "c", state: LetterState.Match },
					{ id: "9", letter: "o", state: LetterState.Match },
					{ id: "10", letter: "n", state: LetterState.Miss },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟥 🟨 🟥 🟩 🟥\n🟩 🟩 🟩 🟩 🟥")
	})

	it("handles empty guesses array", () => {
		const guesses: Array<{ letters: Array<ComputedGuess> }> = []
		const result = boardToEmoji(guesses)
		expect(result).toBe("")
	})

	it("handles typical game progression (6 rows)", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "s", state: LetterState.Present },
					{ id: "2", letter: "t", state: LetterState.Miss },
					{ id: "3", letter: "a", state: LetterState.Miss },
					{ id: "4", letter: "r", state: LetterState.Present },
					{ id: "5", letter: "e", state: LetterState.Miss },
				] satisfies Array<ComputedGuess>,
			},
			{
				letters: [
					{ id: "6", letter: "s", state: LetterState.Match },
					{ id: "7", letter: "o", state: LetterState.Miss },
					{ id: "8", letter: "u", state: LetterState.Miss },
					{ id: "9", letter: "n", state: LetterState.Miss },
					{ id: "10", letter: "d", state: LetterState.Present },
				] satisfies Array<ComputedGuess>,
			},
			{
				letters: [
					{ id: "11", letter: "s", state: LetterState.Match },
					{ id: "12", letter: "h", state: LetterState.Match },
					{ id: "13", letter: "a", state: LetterState.Match },
					{ id: "14", letter: "r", state: LetterState.Match },
					{ id: "15", letter: "d", state: LetterState.Match },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟨 🟥 🟥 🟨 🟥\n🟩 🟥 🟥 🟥 🟨\n🟩 🟩 🟩 🟩 🟩")
	})

	it("handles rows with blank letters (incomplete guesses)", () => {
		const guesses = [
			{
				letters: [
					{ id: "1", letter: "t", state: LetterState.Match },
					{ id: "2", letter: "e", state: LetterState.Present },
					{ id: "3", letter: "s", state: LetterState.Miss },
					{ id: "4", letter: "t", state: LetterState.Miss },
					{ id: "5", letter: "s", state: LetterState.Present },
				] satisfies Array<ComputedGuess>,
			},
			{
				letters: [
					{ id: "6", letter: "", state: LetterState.Blank },
					{ id: "7", letter: "", state: LetterState.Blank },
					{ id: "8", letter: "", state: LetterState.Blank },
					{ id: "9", letter: "", state: LetterState.Blank },
					{ id: "10", letter: "", state: LetterState.Blank },
				] satisfies Array<ComputedGuess>,
			},
		]

		const result = boardToEmoji(guesses)
		expect(result).toBe("🟩 🟨 🟥 🟥 🟨\n⬜️ ⬜️ ⬜️ ⬜️ ⬜️")
	})

	it("throws error for unknown letter state", () => {
		const guesses = [
			{
				letters: [{ id: "1", letter: "x", state: "Invalid" as any }] satisfies Array<ComputedGuess>,
			},
		]

		expect(() => boardToEmoji(guesses)).toThrow("Unknown letter state")
	})
})
