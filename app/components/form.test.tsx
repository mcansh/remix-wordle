import { expect } from "remix/assert"
import { renderToString } from "remix/component/server"
import { describe, it } from "remix/test"

import { GuessForm } from "./form"

describe("GuessForm", () => {
	it.skip("renders 5 letter inputs", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)
		expect(html.match(/<input[^>]*name="letter"/g)?.length ?? 0).toBe(5)
	})

	it("renders inputs with correct labels", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)

		for (let i = 1; i <= 5; i++) {
			expect(html).toContain(`aria-label="letter ${i}"`)
		}
	})

	it("renders form with correct attributes", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)

		expect(html).toContain('method="POST"')
		expect(html).toMatch(/autoComplete="off"|autocomplete="off"/)
		expect(html).toContain('id="current-guess"')
		expect(html).toContain('action="/"')
	})

	it("renders cheat input when cheat prop is true", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} cheat={true} />)

		expect(html).toContain('name="cheat"')
		expect(html).toContain('value="true"')
		expect(html).toContain('type="hidden"')
	})

	it("does not render cheat input when cheat prop is false", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} cheat={false} />)

		expect(html.includes('name="cheat"')).toBe(false)
	})

	it("does not render cheat input when cheat prop is undefined", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)

		expect(html.includes('name="cheat"')).toBe(false)
	})

	it("passes error message to letter inputs", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} error="invalid word" />)

		expect(html.match(/<input[^>]*name="letter"/g)?.length ?? 0).toBe(5)
		expect(html).toContain("border-red-500")
	})

	it("first input has auto focus", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)

		expect(html).toMatch(/autofocus|autoFocus/)
	})

	it("has correct input attributes", async () => {
		let html = await renderToString(<GuessForm currentGuess={0} />)

		expect(html).toContain('type="text"')
		expect(html).toContain('pattern="[a-zA-Z]{1}"')
		expect(html).toMatch(/maxLength="1"|maxlength="1"/)
	})
})
