import { mergeHeaders } from "@mcansh/http-helmet"
import type { Middleware } from "remix/fetch-router"

import { ROBOTS_CONTENT } from "#app/constants.ts"

export function isHtmlContentType(contentType: string | null): boolean {
	if (contentType == null) return false
	return contentType.toLowerCase().includes("text/html")
}

export function htmlRobotsTag(): Middleware {
	return async (_context, next) => {
		let response = await next()
		if (!(response instanceof Response)) return response
		if (!isHtmlContentType(response.headers.get("content-type"))) return response

		return new Response(response.body, {
			headers: mergeHeaders(response.headers, { "X-Robots-Tag": ROBOTS_CONTENT }),
			status: response.status,
			statusText: response.statusText,
		})
	}
}
