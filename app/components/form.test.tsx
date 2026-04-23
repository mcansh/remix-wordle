import { invariant } from "@epic-web/invariant"
import { render, screen } from "@mcansh/remix-testing-library"
import { describe, expect, it, vi } from "vitest"

import { range } from "../utils/range"
import { GuessForm } from "./form"

vi.mock("../routes.ts", () => ({
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

	it("renders inputs with correct labels", () => {
		let Component = GuessForm()
		render(Component({ currentGuess: 0 }))

		for (let i of range(5)) {
			console.log({ i })
		}

		for (let i = 1; i <= 5; i += 1) {
			expect(
				screen.getByRole("textbox", { name: `letter ${i}` }),
			).toBeInTheDocument()
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
		let { container } = render(
			Component({ currentGuess: 0, error: "invalid word" }),
		)

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		invariant(inputs, "form should have letter inputs")
		expect(inputs).toHaveLength(5)
		for (let input of inputs) {
			expect(input).toHaveClass("border-red-500")
		}
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
		invariant(form, "form should be present")
		let input = form.querySelector<HTMLInputElement>('input[name="letter"]')

		expect(input).toHaveAttribute("type", "text")
		expect(input).toHaveAttribute("pattern", "[a-zA-Z]{1}")
		expect(input).toHaveAttribute("maxLength", "1")
	})
})
