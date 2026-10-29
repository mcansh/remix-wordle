import "@testing-library/jest-dom/vitest"
import { render, screen } from "@mcansh/remix-testing-library"
import { describe, it, expect, vi } from "vite-plus/test"

import { GuessForm } from "./form"

vi.mock("#app/routes.ts", () => ({
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
		render(<GuessForm currentGuess={0} />)

		let inputs = screen.getAllByRole("textbox")
		expect(inputs).toHaveLength(5)
	})

	it("renders inputs with correct labels", () => {
		render(<GuessForm currentGuess={0} />)

		for (let i = 1; i <= 5; i++) {
			expect(screen.getByRole("textbox", { name: `letter ${i}` })).toBeInTheDocument()
		}
	})

	it("renders form with correct attributes", () => {
		let { container } = render(<GuessForm currentGuess={0} />)

		let form = container.querySelector("form")
		expect(form).toHaveAttribute("method", "POST")
		expect(form).toHaveAttribute("autoComplete", "off")
		expect(form).toHaveAttribute("id", "current-guess")
		expect(form).toHaveAttribute("action", "/")
	})

	it("renders cheat input when cheat prop is true", () => {
		let { container } = render(<GuessForm currentGuess={0} cheat={true} />)

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).toHaveAttribute("value", "true")
		expect(cheatInput).toHaveAttribute("type", "hidden")
	})

	it("does not render cheat input when cheat prop is false", () => {
		let { container } = render(<GuessForm currentGuess={0} cheat={false} />)

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it("does not render cheat input when cheat prop is undefined", () => {
		let { container } = render(<GuessForm currentGuess={0} />)

		let form = container.querySelector("form")
		let cheatInput = form?.querySelector('input[name="cheat"]')
		expect(cheatInput).not.toBeInTheDocument()
	})

	it("passes error message to letter inputs", () => {
		let { container } = render(<GuessForm currentGuess={0} error="invalid word" />)

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs).toHaveLength(5)
		inputs?.forEach((input) => {
			expect(input).toHaveClass("border-red-500")
		})
	})

	it("first input has auto focus", () => {
		let { container } = render(<GuessForm currentGuess={0} />)

		let form = container.querySelector("form")
		let inputs = form?.querySelectorAll('input[name="letter"]')
		expect(inputs?.[0]).toHaveAttribute("autofocus")
		expect(inputs?.[1]).not.toHaveAttribute("autofocus")
	})

	it("has correct input attributes", () => {
		let { container } = render(<GuessForm currentGuess={0} />)

		let form = container.querySelector("form")
		let input = form?.querySelector('input[name="letter"]') as HTMLInputElement | null

		expect(input).toHaveAttribute("type", "text")
		expect(input).toHaveAttribute("pattern", "[a-zA-Z]{1}")
		expect(input).toHaveAttribute("maxLength", "1")
	})
})
