"use client"

import { on } from "remix/ui"

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
					on("keydown", (event) => {
						if (event.key === "Backspace") {
							let focusedInput = event.currentTarget.querySelector("input:focus")
							if (focusedInput instanceof HTMLInputElement) {
								focusedInput.value = ""
							}
							event.preventDefault()
							if (focusedInput?.previousElementSibling) {
								let previousInput = focusedInput.previousElementSibling
								if (previousInput instanceof HTMLInputElement) {
									previousInput.select()
								}
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
				{cheat ? <input type="hidden" name="cheat" value="true" /> : null}
				{LETTER_INPUTS.map((index) => (
					<LetterInput key={`input-number-${index}`} index={index} errorMessage={error} />
				))}
			</form>
		)
	}
}
