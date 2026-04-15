import "@testing-library/jest-dom/vitest"
import { afterEach, describe, it, expect, vi } from "vitest"
import { createRoot } from 'remix/component'

import { GuessForm } from "./form"



vi.mock("../routes", () => ({
	routes: {
		home: {
			action: {
				href: () => "/",
			},
		},
	},
}))

describe("GuessForm", () => {
	it.skip("renders 5 letter inputs", () => {
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		let inputs = screen.getAllByRole("textbox")
		expect(inputs).toHaveLength(5)
	})

	it.skip("renders inputs with correct labels", () => {
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		for (let i = 1; i <= 5; i++) {
			expect(screen.getByRole("textbox", { name: `letter ${i}` })).toBeInTheDocument()
		}
	})

	it.skip("renders form with correct attributes", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		expect(form).toHaveAttribute("method", "POST")
		expect(form).toHaveAttribute("autoComplete", "off")
		expect(form).toHaveAttribute("id", "current-guess")
		expect(form).toHaveAttribute("action", "/")
	})

	it.skip("renders cheat input when cheat prop is true", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, cheat: true }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).toHaveAttribute("value", "true")
		expect(cheatInput).toHaveAttribute("type", "hidden")
	})

	it.skip("does not render cheat input when cheat prop is false", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, cheat: false }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it.skip("does not render cheat input when cheat prop is undefined", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it.skip("passes error message to letter inputs", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, error: "invalid word" }))

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs).toHaveLength(5)
		inputs?.forEach((input) => {
			expect(input).toHaveClass("border-red-500")
		})
	})

	it.skip("first input has auto focus", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs?.[0]).toHaveAttribute("autofocus")
		expect(inputs?.[1]).not.toHaveAttribute("autofocus")
	})

	it.skip("has correct input attributes", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let input = form?.querySelector('input[name="letter"]') as HTMLInputElement | null

		expect(input).toHaveAttribute("type", "text")
		expect(input).toHaveAttribute("pattern", "[a-zA-Z]{1}")
		expect(input).toHaveAttribute("maxLength", "1")
	})

	it("moves focus to next input when typing", async () => {
		let container = document.createElement('div')
		let root = createRoot(container)

		root.render(<GuessForm currentGuess={0} />)
		root.flush()

		let first = container.querySelector<HTMLInputElement>('input[aria-label="Letter 1"]')
		first.value = "a"

		root.flush()

		let second = container.querySelector<HTMLInputElement>('input[aria-label="Letter 2"]')
		expect(second).toHaveFocus()
	})
})
