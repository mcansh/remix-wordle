// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vite-plus/test"

import { handleGuessFormBackspace, hasFilledInputAfter } from "./has-filled-input-after"

describe("hasFilledInputAfter", () => {
	it("returns true when a later text input contains a value", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		first.name = "letter"
		second.type = "text"
		second.name = "letter"
		third.type = "text"
		third.name = "letter"
		first.value = "a"
		second.value = ""
		third.value = "c"

		form.append(first, second, third)

		expect(hasFilledInputAfter(form, second)).toBe(true)
	})

	it("returns false when later text inputs are empty", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		first.name = "letter"
		second.type = "text"
		second.name = "letter"
		third.type = "text"
		third.name = "letter"
		first.value = "a"
		second.value = ""
		third.value = ""

		form.append(first, second, third)

		expect(hasFilledInputAfter(form, second)).toBe(false)
	})
})

describe("handleGuessFormBackspace", () => {
	it("clears the current input without selecting previous when a later input is filled", () => {
		let form = document.createElement("form")
		let first = document.createElement("input")
		let second = document.createElement("input")
		let third = document.createElement("input")

		first.type = "text"
		first.name = "letter"
		second.type = "text"
		second.name = "letter"
		third.type = "text"
		third.name = "letter"
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

		let event = new KeyboardEvent("keydown", { key: "Backspace", bubbles: true, cancelable: true })
		Object.defineProperty(event, "target", { value: second, writable: false })
		form.dispatchEvent(event)

		expect(second.value).toBe("")
		expect(selectSpy).not.toHaveBeenCalled()
		expect(prevented).toBe(true)
	})
})
