import type * as Remix from "remix/component"
import { renderToStream } from "remix/component/server"
import { getContext } from "remix/middleware/async-context"
import { createHtmlResponse } from "remix/response/html"

import { assetManifestAvailable, assets } from "#app/assets.ts"
import { router } from "#app/router.ts"

export function render(node: Remix.RemixNode, init?: ResponseInit) {
	let context = getContext()
	let request = context.request

	let stream = renderToStream(node, {
		resolveFrame: (src) => resolveFrame(request, src),
		onError: console.error,
		resolveClientEntry: async (entryId, component) => {
			let hashIndex = entryId.lastIndexOf("#")
			let sourceId = hashIndex === -1 ? entryId : entryId.slice(0, hashIndex)
			let explicitExportName = hashIndex === -1 ? "" : entryId.slice(hashIndex + 1)
			let exportName = explicitExportName || component.name

			if (sourceId.startsWith("file:") && assetManifestAvailable) {
				let { href, importMap, preloads } = await assets.getScriptEntry(sourceId)
				return { href, importMap, exportName, preloads }
			}

			return { href: sourceId, exportName }
		},
	})

	return createHtmlResponse(stream, init)
}

async function resolveFrame(request: Request, src: string) {
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

export function renderFragment(node: Remix.RemixNode, init?: ResponseInit) {
	let headers = new Headers(init?.headers)
	if (!headers.has("Cache-Control")) {
		headers.set("Cache-Control", "no-store")
	}

	return render(node, { ...init, headers })
}
