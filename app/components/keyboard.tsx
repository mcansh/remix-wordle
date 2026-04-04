import { clsx } from "clsx"

import type { keyboardWithStatus } from "#app/utils/game.ts"

export function Keyboard() {
	return ({ board }: { board: ReturnType<typeof keyboardWithStatus> }) => {
		return (
			<div class="mx-auto max-w-md pt-10">
				{board.map((row, index) => {
					let letters = row.map((letter) => letter.letter).join("")
					return (
						<div
							key={`keyboard-row-${letters}`}
							class={clsx("flex justify-center gap-2", { "mt-2": index > 0 })}
						>
							{row.map((letter) => {
								return (
									<div
										data-state={letter.state}
										class={`flex size-10 items-center justify-center rounded text-center text-white uppercase data-[state=Blank]:bg-gray-400 data-[state=Match]:bg-green-500 data-[state=Miss]:bg-red-500 data-[state=Present]:bg-yellow-500`}
										key={`keyboard-letter-${letter.letter}`}
									>
										{letter.letter}
									</div>
								)
							})}
						</div>
					)
				})}
			</div>
		)
	}
}
