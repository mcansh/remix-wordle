export const WORD_LENGTH = 5
export const LETTER_INPUTS = [...Array(WORD_LENGTH).keys()]
export const TOTAL_GUESSES = 6
export const REVEAL_WORD = "cheat"

export const SITE_TITLE = "Remix Wordle"
export const SITE_ORIGIN = "https://wordle.mcan.sh"
export const SITE_URL = `${SITE_ORIGIN}/`
export const SITE_IMAGE_URL = `${SITE_ORIGIN}/apple-touch-icon.png`
export const SITE_DESCRIPTION =
	"Play Remix Wordle, a daily Wordle-style game built with Remix. Guess the five-letter word in six tries. Letters mark as green, yellow, or red after each guess."
export const LANDING_TITLE = "Remix Wordle — Play a daily five-letter word game"
/** Public marketing HTML (the logged-out landing page). */
export const ROBOTS_INDEX = "index, follow"
/** App and account HTML. Do not apply this site-wide; the landing page opts into ROBOTS_INDEX. */
export const ROBOTS_NOINDEX = "noindex, nofollow"

export const SITE_JSON_LD = JSON.stringify({
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: SITE_TITLE,
	url: SITE_URL,
	description: SITE_DESCRIPTION,
	applicationCategory: "GameApplication",
	operatingSystem: "Any",
	image: SITE_IMAGE_URL,
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
})
