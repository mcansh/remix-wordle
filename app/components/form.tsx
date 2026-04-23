"use client"

import type { Handle } from "remix/component"
import { on, keysEvents } from "remix/component"

import { CHEAT_SESSION_KEY, LETTER_INPUTS } from "#app/constants.ts"
import { routes } from "#app/routes.ts"

import { LetterInput } from "./letter-input"

const CHEAT_CODE = "cheat"
const CHEAT_WINDOW_MS = 2_000

export function GuessForm(handle: Handle) {
	let cheatEnabled = false
	let cheatBuffer = ""
	let cheatStartedAt = 0
	let hydrated = false

	return ({
		currentGuess,
		cheat,
		error,
	}: {
		currentGuess: number
		error?: string
		cheat?: boolean
	}) => {
		if (!hydrated) {
			hydrated = true
			cheatEnabled = cheat === true
			if (typeof window !== "undefined") {
				cheatEnabled =
					cheatEnabled || window.sessionStorage.getItem(CHEAT_SESSION_KEY) === "true"
			}
		}

		if (cheat && !cheatEnabled) {
			cheatEnabled = true
		}

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
					on("keydown", async (event) => {
						let target = event.target
						if (!(target instanceof HTMLInputElement)) return
						if (!/^[a-zA-Z]$/.test(event.key)) return

						let now = Date.now()
						let letter = event.key.toLowerCase()
						if (cheatBuffer === "" || now - cheatStartedAt > CHEAT_WINDOW_MS) {
							cheatBuffer = letter
							cheatStartedAt = now
						} else {
							cheatBuffer += letter
						}

						if (!CHEAT_CODE.startsWith(cheatBuffer)) {
							if (letter === CHEAT_CODE[0]) {
								cheatBuffer = letter
								cheatStartedAt = now
							} else {
								cheatBuffer = ""
								cheatStartedAt = 0
							}
							return
						}

						if (cheatBuffer === CHEAT_CODE && now - cheatStartedAt <= CHEAT_WINDOW_MS) {
							cheatBuffer = ""
							cheatStartedAt = 0
							if (!cheatEnabled) {
								cheatEnabled = true
								if (typeof window !== "undefined") {
									window.sessionStorage.setItem(CHEAT_SESSION_KEY, "true")
								}
								await handle.update()
							}
						}
					}),
				]}
			>
				{cheatEnabled ? <input type="hidden" name="cheat" value="true" /> : null}
				{LETTER_INPUTS.map((index) => (
					<LetterInput key={`input-number-${index}`} index={index} errorMessage={error} />
				))}
			</form>
		)
	}
}
