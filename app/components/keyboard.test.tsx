import "@testing-library/jest-dom/vitest"
import { render, screen } from "@mcansh/remix-testing-library"
import { describe, expect, it } from "vitest"

import { LetterState } from "#app/utils/game.ts"

import { Keyboard } from "./keyboard"

describe("Keyboard", () => {
	it("renders all keyboard letters as buttons", () => {
		let Component = Keyboard()
		render(
			Component({
				board: [
					[
						{ letter: "q", state: LetterState.Blank },
						{ letter: "w", state: LetterState.Match },
					],
					[{ letter: "a", state: LetterState.Present }],
					[{ letter: "z", state: LetterState.Miss }],
				],
			}),
		)

		let letters = ["q", "w", "a", "z"]
		for (let letter of letters) {
			let button = screen.getByRole("button", { name: `keyboard letter ${letter}` })
			expect(button).toHaveTextContent(letter)
		}
	})
})
