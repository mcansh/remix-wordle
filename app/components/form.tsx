"use client"

import { on, keysEvents } from "remix/component"

import { LETTER_INPUTS } from "#app/constants.ts"
import { routes } from "#app/routes.ts"

import { LetterInput } from "./letter-input"

export function GuessForm() {
	return ({
		currentGuess,
		cheat,
		error,
	}: {
		currentGuess: number
		error?: string
		cheat?: boolean
	}) => {
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
							focusedInput.value = ""
						}
						event.preventDefault()
						let letterInputs = Array.from(
							event.currentTarget.querySelectorAll("input[name=\"letter\"]"),
						)
						let focusedIndex = letterInputs.indexOf(focusedInput as HTMLInputElement)
						let previousInput = focusedIndex > 0 ? letterInputs[focusedIndex - 1] : undefined
						if (previousInput instanceof HTMLInputElement) {
							previousInput.focus()
							previousInput.select()
						}
					}),
					on("input", (event) => {
						let target = event.target
						if (!(target instanceof HTMLInputElement)) return
						if (target.value === "") return
						let letterInputs = Array.from(
							event.currentTarget.querySelectorAll("input[name=\"letter\"]"),
						)
						let focusedIndex = letterInputs.indexOf(target)
						let nextInput =
							focusedIndex >= 0 && focusedIndex < letterInputs.length - 1
								? letterInputs[focusedIndex + 1]
								: undefined
						if (nextInput instanceof HTMLInputElement) {
							nextInput.focus()
							nextInput.select()
						}
					}),
				]}
			>
				{cheat ? <input type="hidden" name="cheat" value="true" /> : null}
				{LETTER_INPUTS.map((index) => (
					<LetterInput key={`input-number-${index}`} index={index} errorMessage={error} />
				))}
			</form>
		)
	}
}
