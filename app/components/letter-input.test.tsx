import { cleanup, render, screen } from "@mcansh/remix-testing-library"
import "@testing-library/jest-dom/vitest"
import { userEvent } from "@testing-library/user-event"
import { afterEach } from "vite-plus/test"
import { describe, it, expect } from "vitest"

import { LetterInput } from "./letter-input.tsx"

afterEach(cleanup)

describe("LetterInput", () => {
	it("only lets you type 1 letter", async () => {
		let user = userEvent.setup()

		render(<LetterInput index={0} />)

		let input = screen.getByRole("textbox", { name: /letter 1/i })

		await user.type(input, "abc")

		expect(input).toHaveValue("a")
	})
})
