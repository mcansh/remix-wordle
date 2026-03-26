"use client"

import type { Handle, RemixNode } from "remix/component"
import { on } from "remix/component"

import { routes } from "../routes"

export function GuessForm(handle: Handle) {
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
					on("submit", async (event, signal) => {
						event.preventDefault()

						const formData = new FormData(event.currentTarget)

						let response = await fetch(event.currentTarget.action, {
							method: "POST",
							body: formData,
							credentials: "same-origin",
							signal,
						})

						if (!response.ok) {
							throw new Error("Failed to submit guess")
						}

						if (signal.aborted) return

						await handle.frame.reload()
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
