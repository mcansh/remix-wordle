import { expect } from "remix/assert"
import { render } from "remix/component/test"
import { describe, it } from "remix/test"

import { LetterInput } from "./letter-input.tsx"

describe("LetterInput", () => {
	it("only lets you type 1 letter", async (t) => {
		let { $, act, cleanup } = render(<LetterInput index={0} />)
		t.after(cleanup)

		let input = $("input")
		expect(input).toBeInstanceOf(HTMLInputElement)
		if (!(input instanceof HTMLInputElement)) {
			throw new Error("Expected an input")
		}

		expect(input.getAttribute("aria-label")).toMatch(/letter 1/i)
		expect(input.maxLength).toBe(1)

		await act(() => {
			input.focus()
			input.value = ""
			for (let letter of "abc") {
				if (input.value.length < input.maxLength) {
					input.value += letter
				}
				input.dispatchEvent(new InputEvent("input", { bubbles: true, data: letter }))
			}
		})

		expect(input.value).toBe("a")
	})
})
