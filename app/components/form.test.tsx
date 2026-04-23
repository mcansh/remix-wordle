import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@mcansh/remix-testing-library"
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"

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
	beforeEach(() => {
		window.sessionStorage.clear()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it.skip("renders 5 letter inputs", () => {
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		let inputs = screen.getAllByRole("textbox")
		expect(inputs).toHaveLength(5)
	})

	it("renders inputs with correct labels", () => {
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		for (let i = 1; i <= 5; i++) {
			expect(screen.getByRole("textbox", { name: `letter ${i}` })).toBeInTheDocument()
		}
	})

	it("renders form with correct attributes", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		expect(form).toHaveAttribute("method", "POST")
		expect(form).toHaveAttribute("autoComplete", "off")
		expect(form).toHaveAttribute("id", "current-guess")
		expect(form).toHaveAttribute("action", "/")
	})

	it("renders cheat input when cheat prop is true", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, cheat: true }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).toHaveAttribute("value", "true")
		expect(cheatInput).toHaveAttribute("type", "hidden")
	})

	it("does not render cheat input when cheat prop is false", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, cheat: false }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it("does not render cheat input when cheat prop is undefined", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it("passes error message to letter inputs", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0, error: "invalid word" }))

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs).toHaveLength(5)
		inputs?.forEach((input) => {
			expect(input).toHaveClass("border-red-500")
		})
	})

	it("first input has auto focus", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs?.[0]).toHaveAttribute("autofocus")
		expect(inputs?.[1]).not.toHaveAttribute("autofocus")
	})

	it("has correct input attributes", () => {
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let input = form?.querySelector('input[name="letter"]') as HTMLInputElement | null

		expect(input).toHaveAttribute("type", "text")
		expect(input).toHaveAttribute("pattern", "[a-zA-Z]{1}")
		expect(input).toHaveAttribute("maxLength", "1")
	})

	it("enables cheat when cheat is typed within 2 seconds", async () => {
		vi.useFakeTimers()
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		let input = screen.getByRole("textbox", { name: "letter 1" })
		expect(input).toBeInTheDocument()

		for (let letter of "cheat") {
			fireEvent.keyDown(input, { key: letter })
			vi.advanceTimersByTime(300)
		}

		vi.runAllTimers()
		let cheatInput = await screen.findByDisplayValue("true")
		expect(cheatInput).toHaveAttribute("name", "cheat")
		expect(window.sessionStorage.getItem("wordle-cheat-enabled")).toBe("true")
	})

	it("does not enable cheat when typing cheat takes more than 2 seconds", () => {
		vi.useFakeTimers()
		let Component = GuessForm()
		let { container } = render(Component({ currentGuess: 0 }))

		let form = container.querySelector("form")
		let input = form?.querySelector('input[name="letter"]')
		expect(input).toBeInTheDocument()

		fireEvent.keyDown(input!, { key: "c" })
		vi.advanceTimersByTime(2_100)
		for (let letter of "heat") {
			fireEvent.keyDown(input!, { key: letter })
			vi.advanceTimersByTime(100)
		}
		vi.runAllTimers()

		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
		expect(window.sessionStorage.getItem("wordle-cheat-enabled")).toBeNull()
	})
})
