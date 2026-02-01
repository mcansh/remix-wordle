/**
 * Converts a short date string with slashes to a URL-safe format with hyphens.
 * Example: "1/15/24" -> "1-15-24"
 */
export function dateToUrlFormat(dateString: string): string {
	return dateString.replace(/\//g, "-")
}

/**
 * Converts a URL-safe date string with hyphens back to a display format with slashes.
 * Example: "1-15-24" -> "1/15/24"
 */
export function urlFormatToDate(urlDateString: string): string {
	return urlDateString.replace(/-/g, "/")
}
