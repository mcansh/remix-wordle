import { getContext } from "remix/async-context-middleware"
import type { RemixNode } from "remix/component"
import { renderToStream } from "remix/component/server"
import type { Router } from "remix/fetch-router"
import { createHtmlResponse } from "remix/response/html"

import { Document } from "../components/document.tsx"
import { getCSPNonce } from "./context.ts"

export function render(node: RemixNode, init?: ResponseInit) {
	let context = getContext()
	let request = context.request
	let router = context.router

	let stream = renderToStream(node, {
		resolveFrame: (src) => resolveFrame(request, router, src),
		onError: console.error,
	})

	return createHtmlResponse(stream, init)
}

export async function renderDocument(
	node: RemixNode,
	{ head, ...init }: ResponseInit & { head?: RemixNode } = {
		head: <title>Remix Wordle</title>,
	},
) {
	let nonce = getCSPNonce()
	return render(
		<Document nonce={nonce} head={head}>
			{node}
		</Document>,
		init,
	)
}

async function resolveFrame(request: Request, router: Router, src: string) {
	let url = new URL(src, request.url)

	let headers = new Headers()
	headers.set("accept", "text/html")
	headers.set("accept-encoding", "identity")

	let cookie = request.headers.get("cookie")
	if (cookie) headers.set("cookie", cookie)

	let res = await router.fetch(
		new Request(url, {
			method: "GET",
			headers,
			signal: request.signal,
		}),
	)

	if (!res.ok) {
		return `<pre>Frame error: ${res.status} ${res.statusText}</pre>`
	}

	if (res.body) return res.body
	return res.text()
}

export function renderFragment(node: RemixNode, init?: ResponseInit) {
	let headers = new Headers(init?.headers)
	if (!headers.has("Cache-Control")) {
		headers.set("Cache-Control", "no-store")
	}

	return render(node, { ...init, headers })
}
