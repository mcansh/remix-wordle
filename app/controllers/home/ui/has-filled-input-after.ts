export function hasFilledInputAfter(form: HTMLFormElement, currentInput: HTMLInputElement) {
	let inputs = form.elements
	let seenCurrent = false
	for (let input of inputs) {
		if (!(input instanceof HTMLInputElement)) {
			continue
		}

		if (input === currentInput) {
			seenCurrent = true
			continue
		}

		if (seenCurrent && input.value !== "") {
			console.log("hasFilledInputAfter: found filled", { inputName: input.name, inputValue: input.value })
			return true
		}
	}
	return false
}

export function handleGuessFormBackspace(event: Event) {
	let target = event.target
	if (!(target instanceof HTMLInputElement)) return

	let form = target.form
	if (!form) return

	console.log("backspace:", { value: target.value, hasFilledAfter: hasFilledInputAfter(form, target) })

	if (target.value !== "") {
		target.value = ""
		event.preventDefault()
		return
	}

	if (hasFilledInputAfter(form, target)) {
		event.preventDefault()
		return
	}
}
