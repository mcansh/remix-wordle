// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vite-plus/test"

import { handleGuessFormBackspace } from "#app/components/form.tsx"
import { hasFilledInputAfter } from "#app/components/has-filled-input-after.ts"

describe("hasFilledInputAfter", () => {
	it("returns true when a later text input contains a value", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		second.type = "text"
		third.type = "text"
		first.value = "a"
		second.value = ""
		third.value = "c"

		form.append(first, second, third)

		expect(hasFilledInputAfter(second)).toBe(true)
	})

	it("returns false when later text inputs are empty", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		second.type = "text"
		third.type = "text"
		first.value = "a"
		second.value = ""
		third.value = ""

		form.append(first, second, third)

		expect(hasFilledInputAfter(second)).toBe(false)
	})
})

describe("handleGuessFormBackspace", () => {
	it("clears the current input without selecting previous when a later input is filled", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		second.type = "text"
		third.type = "text"
		first.value = "a"
		second.value = "b"
		third.value = "c"

		let selectSpy = vi.spyOn(first, "select")

		form.append(first, second, third)
		document.body.append(form)
		second.focus()

		let prevented = false
		form.addEventListener("keydown", (event) => {
			if (event.key === "Backspace") {
				handleGuessFormBackspace(event)
				prevented = event.defaultPrevented
			}
		})

		second.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }))

		expect(second.value).toBe("")
		expect(selectSpy).not.toHaveBeenCalled()
		expect(prevented).toBe(true)
	})
})
