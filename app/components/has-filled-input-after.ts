export function hasFilledInputAfter(input: HTMLInputElement) {
	let sibling = input.nextElementSibling
	while (sibling) {
		if (sibling instanceof HTMLInputElement && sibling.type === "text" && sibling.value !== "") {
			return true
		}
		sibling = sibling.nextElementSibling
	}

	return false
}
