import type { Middleware } from "remix/fetch-router"

import { createSecureHeaders, mergeHeaders, type CreateSecureHeaders } from "@mcansh/http-helmet"

export type SecurityHeadersMiddleware = CreateSecureHeaders & {
	skip?: (context: Parameters<Middleware>[0]) => boolean
}

export function securityHeaders({ skip, ...config }: SecurityHeadersMiddleware): Middleware {
	return async (context, next) => {
		if (skip?.(context)) return next()

		let headers = createSecureHeaders(config)

		let response = await next()

		return new Response(response.body, {
			headers: mergeHeaders(response.headers, headers),
			status: response.status,
			statusText: response.statusText,
		})
	}
}
