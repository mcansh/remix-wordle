import clsx from "clsx"
import type { Handle } from "remix/component"

export function LetterInput(handle: Handle<{ errorMessage?: string | null; index: number }>) {
	return () => {
		let { errorMessage, index } = handle.props
		return (
			<input
				class={clsx(
					"inline-block aspect-square w-full border-4 text-center text-xl uppercase",
					errorMessage ? "border-red-500" : "border-gray-900 empty:border-gray-400",
				)}
				type="text"
				pattern="[a-zA-Z]{1}"
				maxLength={1}
				name="letter"
				aria-label={`letter ${index + 1}`}
				placeholder=" "
				autoFocus={index === 0}
			/>
		)
	}
}
