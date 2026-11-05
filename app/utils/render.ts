import type * as Remix from "remix/component"
import { renderToStream } from "remix/component/server"
import { getContext } from "remix/middleware/async-context"
import { getCspNonce, inheritCspNonce } from "remix/middleware/csp"
import { createHtmlResponse } from "remix/response/html"

import { router } from "#app/router.ts"

export function render(node: Remix.RemixNode, init?: ResponseInit) {
	let context = getContext()
	let request = context.request
	let nonce = getCspNonce(context)

	let stream = renderToStream(node, {
		nonce,
		resolveFrame: (src) => resolveFrame(request, src, nonce),
		onError: console.error,
	})

	let headers = new Headers(init?.headers)
	if (!headers.has("Cache-Control")) {
		headers.set("Cache-Control", "private")
	}

	return createHtmlResponse(stream, { ...init, headers })
}

async function resolveFrame(request: Request, src: string, nonce?: string) {
	let url = new URL(src, request.url)

	let headers = new Headers()
	headers.set("Accept", "text/html")
	headers.set("Accept-Encoding", "identity")

	let cookie = request.headers.get("Cookie")
	if (cookie) headers.set("Cookie", cookie)

	let frameRequest = new Request(url, {
		method: "GET",
		headers,
		signal: request.signal,
	})
	if (nonce) inheritCspNonce(frameRequest, nonce)

	let res = await router.fetch(frameRequest)

	if (!res.ok) {
		return `<pre>Frame error: ${res.status} ${res.statusText}</pre>`
	}

	if (res.body) return res.body
	return res.text()
}

export function renderFragment(node: Remix.RemixNode, init?: ResponseInit) {
	let headers = new Headers(init?.headers)
	if (!headers.has("Cache-Control")) {
		headers.set("Cache-Control", "no-store")
	}

	return render(node, { ...init, headers })
}
