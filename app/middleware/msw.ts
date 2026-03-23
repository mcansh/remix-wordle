import { handleRequest, type LifeCycleEventsMap, type RequestHandler } from "msw"
import type { Middleware } from "remix/fetch-router"
import { Emitter } from "strict-event-emitter"

let emitter = new Emitter<LifeCycleEventsMap>()

export function createRouterMiddleware(...handlers: Array<RequestHandler>): Middleware {
	return async (context, next) => {
		let method = context.method || "GET"
		let canRequestHaveBody = method !== "HEAD" && method !== "GET"

    let body = canRequestHaveBody ? context.request.clone().body : undefined

		let fetchRequest = new Request(
			// Treat all relative URLs as the ones coming from the server.
			context.url,
			{
				method,
				headers: context.headers,
				credentials: "omit",
				// @ts-ignore Internal Undici property.
				duplex: canRequestHaveBody ? "half" : undefined,
				body
			},
		)

		await handleRequest(
			fetchRequest,
			crypto.randomUUID(),
			handlers,
			{ onUnhandledRequest: () => null },
			emitter,
			{
				resolutionContext: {
					/**
					 * @note Resolve relative request handler URLs against
					 * the server's origin (no relative URLs in Node.js).
					 */
					baseUrl: context.url.origin,
				},
				async onPassthroughResponse() {
					return await next()
				},
			},
		).catch(next)
	}
}
