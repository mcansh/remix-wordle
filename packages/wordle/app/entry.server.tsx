import { createSecureHeaders, mergeHeaders, NONE, SELF } from "@mcansh/http-helmet"

import { router } from "./router"

let securityHeaders = createSecureHeaders({
	"Content-Security-Policy": {
		"default-src": [NONE],
		"script-src": [SELF, "https://cdn.usefathom.com/script.js"],
		"connect-src": [SELF, ...(import.meta.env.DEV ? ["ws"] : [])],
		"style-src": [SELF],
		"img-src": [SELF, "https://cdn.usefathom.com"],
	},
	"X-Content-Type-Options": "nosniff",
	"X-DNS-Prefetch-Control": "on",
	"X-Frame-Options": "DENY",
	"X-XSS-Protection": "1; mode=block",
	"Strict-Transport-Security": true,
	"Referrer-Policy": "strict-origin-when-cross-origin",
})

export default {
	async fetch(request: Request) {
		let response = await router.fetch(request)
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: mergeHeaders(response.headers, securityHeaders),
		})
	},
}

if (import.meta.hot) {
	import.meta.hot.accept()
}
