import { getContext } from "remix/async-context-middleware"
import type { RemixNode } from "remix/component"
import { renderToStream } from "remix/component/server"
import type { Router } from "remix/fetch-router"
import { createHtmlResponse } from "remix/response/html"

import { assetServer } from "./assets"

export function render(node: RemixNode, init?: ResponseInit) {
	let context = getContext()
	let request = context.request
	let router = context.router

	let stream = renderToStream(node, {
		async resolveFrame(src) {
			return resolveFrame(request, router, src)
		},
		onError: console.error,
		resolveClientEntry,
	})

	return createHtmlResponse(stream, init)
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

async function resolveClientEntry(entryId: string, component: unknown) {
	if (!entryId.startsWith("file://")) {
		throw new Error(
			`Expected \`import.meta.url\` for clientEntry ID, received "${entryId}"`,
		)
	}

	let componentName = typeof component === "function" ? component.name : ""
	if (!componentName) {
		throw new Error(`Expected a named clientEntry component for "${entryId}"`)
	}

	return {
		href: await assetServer.getHref(entryId),
		exportName: componentName,
	}
}
