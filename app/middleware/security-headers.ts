import type { CreateSecureHeaders } from "@mcansh/http-helmet"
import { createNonce, createSecureHeaders } from "@mcansh/http-helmet"
import type { Middleware } from "remix/fetch-router"

import { setCSPNonce } from "../utils/context"

type Context = Parameters<Middleware>[0]

export type SecurityHeadersMiddlewareOptions = {
	skip?: (context: Context) => boolean
	fn: (nonce: string) => CreateSecureHeaders
}

export function createSecurityHeadersMiddleware({
	skip,
	fn,
}: SecurityHeadersMiddlewareOptions): Middleware {
	return async (context, next) => {
		let nonce = createNonce()
		setCSPNonce(nonce)
		if (skip && skip(context)) return await next()
		let options = fn(nonce)
		let securityHeaders = createSecureHeaders(options)
		let response = await next()

		return new Response(response.body, {
			headers: { ...response.headers, ...securityHeaders },
			status: response.status,
			statusText: response.statusText,
		})
	}
}
