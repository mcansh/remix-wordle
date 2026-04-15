"use client"

import type { RemixNode } from "remix/component"
import { on, keysEvents } from "remix/component"

import { hasFilledInputAfter } from "#app/components/has-filled-input-after.ts"
import { routes } from "#app/routes.ts"

export function handleGuessFormBackspace(event: KeyboardEvent) {
	let focusedInput =
		event.currentTarget instanceof Element ? event.currentTarget.querySelector("input:focus") : null
	if (focusedInput instanceof HTMLInputElement) {
		let hasFilledInputLater = hasFilledInputAfter(focusedInput)
		if (focusedInput.value !== "") {
			focusedInput.value = ""
		}
		event.preventDefault()
		if (hasFilledInputLater) {
			return
		}
		if (focusedInput.previousElementSibling) {
			let previousInput = focusedInput.previousElementSibling
			if (previousInput instanceof HTMLInputElement) {
				previousInput.select()
			}
		}
		return
	}

	event.preventDefault()
}

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
						handleGuessFormBackspace(event as KeyboardEvent)
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
