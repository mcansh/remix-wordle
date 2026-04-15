"use client"

import type { RemixNode } from "remix/component"
import { on, keysEvents } from "remix/component"

import { routes } from "#app/routes.ts"

export function GuessForm() {
	return ({ currentGuess, children }: { currentGuess: number; children: RemixNode }) => {
		return (
			<form
				method="POST"
				action={routes.home.action.href()}
				key={`current-guess-${currentGuess}`}
				class="grid grid-cols-5 gap-4"
				id="current-guess"
				autoComplete="off"
				mix={[
					keysEvents(),
					on(keysEvents.backspace, (event) => {
						let focusedInput = event.currentTarget.querySelector("input:focus")
						if (focusedInput instanceof HTMLInputElement) {
							let hasFilledInputAfter = false
							let sibling = focusedInput.nextElementSibling
							while (sibling) {
								if (
									sibling instanceof HTMLInputElement &&
									sibling.type === "text" &&
									sibling.value !== ""
								) {
									hasFilledInputAfter = true
									break
								}
								sibling = sibling.nextElementSibling
							}
							focusedInput.value = ""
							if (hasFilledInputAfter) {
								event.preventDefault()
								return
							}
						}
						event.preventDefault()
						if (focusedInput?.previousElementSibling) {
							let previousInput = focusedInput.previousElementSibling
							if (previousInput instanceof HTMLInputElement) {
								previousInput.select()
							}
						}
					}),
					on("input", (event) => {
						let target = event.target
						if (!(target instanceof HTMLInputElement)) return
						if (target.value === "") return
						if (target.nextElementSibling) {
							let nextInput = target.nextElementSibling
							if (nextInput instanceof HTMLInputElement) {
								nextInput.select()
							}
						}
					}),
				]}
			>
				{children}
			</form>
		)
	}
}
