import { render, screen } from "@mcansh/remix-testing-library"
import { describe, expect, it } from "vitest"

import { keyboardWithStatus, LetterState } from "../utils/game.ts"
import { Keyboard } from "./keyboard.tsx"

function makeGuess(letter: string, state: LetterState) {
	return { id: Math.random().toString(36), letter, state }
}

describe("Keyboard", () => {
	it("renders all keys in correct layout", async () => {
		let board = keyboardWithStatus([])
		render(<Keyboard board={board} />)

		expect(screen.getByText("q")).toBeInTheDocument()
		expect(screen.getByText("w")).toBeInTheDocument()
		expect(screen.getByText("e")).toBeInTheDocument()
		expect(screen.getByText("p")).toBeInTheDocument()
		expect(screen.getByText("z")).toBeInTheDocument()
		expect(screen.getByText("m")).toBeInTheDocument()
	})

	it("renders blank state with gray background", async () => {
		let board = keyboardWithStatus([])
		render(<Keyboard board={board} />)

		let key = screen.getByText("a")
		expect(key).toHaveAttribute("data-state", "Blank")
	})

	it("renders miss state with red background", async () => {
		let board = keyboardWithStatus([
			{ letters: [makeGuess("a", LetterState.Miss)] },
		])
		render(<Keyboard board={board} />)

		let key = screen.getByText("a")
		expect(key).toHaveAttribute("data-state", "Miss")
	})

	it("renders present state with yellow background", async () => {
		let board = keyboardWithStatus([
			{ letters: [makeGuess("a", LetterState.Present)] },
		])
		render(<Keyboard board={board} />)

		let key = screen.getByText("a")
		expect(key).toHaveAttribute("data-state", "Present")
	})

	it("renders match state with green background", async () => {
		let board = keyboardWithStatus([
			{ letters: [makeGuess("a", LetterState.Match)] },
		])
		render(<Keyboard board={board} />)

		let key = screen.getByText("a")
		expect(key).toHaveAttribute("data-state", "Match")
	})

	it("upgrades to match when same letter has multiple states", async () => {
		let board = keyboardWithStatus([
			{ letters: [makeGuess("a", LetterState.Miss)] },
			{ letters: [makeGuess("a", LetterState.Match)] },
		])
		render(<Keyboard board={board} />)

		let key = screen.getByText("a")
		expect(key).toHaveAttribute("data-state", "Match")
	})
})
