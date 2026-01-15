"use client"

import type { Remix } from "@remix-run/dom"

import { dom } from "@remix-run/events"

import { routes } from "../routes"

export function Form({
	currentGuess,
	children,
}: {
	currentGuess: number
	children: Remix.RemixNode
}) {
	return () => (
		<form
			method="POST"
			action={routes.home.action.href()}
			key={`current-guess-${currentGuess}`}
			className="grid grid-cols-5 gap-4"
			id="current-guess"
			autoComplete="off"
			on={[
				dom.input((event) => {
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
