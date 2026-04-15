// @vitest-environment happy-dom

import { describe, expect, it } from "vite-plus/test"

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
