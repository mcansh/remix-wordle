import { render, screen } from "@mcansh/remix-testing-library"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { LetterInput } from "./letter-input.tsx"

describe("LetterInput", () => {
	it("only lets you type 1 letter", async () => {
		render(<LetterInput index={0} />)

		let input = screen.getByRole("textbox", { name: /letter 1/i })

		await userEvent.type(input, "abc")

		expect(input).toHaveValue("a")
	})
})
