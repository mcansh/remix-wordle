"use client"

import type { RemixNode } from "remix/component"
import { keysEvents, on } from "remix/component"

import { routes } from "#app/routes.ts"

import { handleGuessFormBackspace } from "./has-filled-input-after.ts"

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
					on<HTMLFormElement, typeof keysEvents.enter>(keysEvents.enter, (event) => {
						event.preventDefault()
						event.currentTarget.submit()
					}),
					on<HTMLFormElement, typeof keysEvents.backspace>(
						keysEvents.backspace,
						handleGuessFormBackspace,
					),
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
