import type { Handle, RemixNode } from "remix/component"
import { ImportMap } from "remix/component/server"

import "#app/app.css"
import { scriptEntry, stylesheets } from "#app/assets.ts"

type DocumentProps = {
	children?: RemixNode
	head?: RemixNode
	url: URL
}

export function Document(handle: Handle<DocumentProps>) {
	return () => {
		let { children, url, head } = handle.props
		let canonical = url.origin + url.pathname
		let { href, importMap, preloads } = scriptEntry
		let hasImportMap = Object.keys(importMap.imports).length > 0

		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					{stylesheets.map((stylesheetHref) => (
						<link key={stylesheetHref} rel="stylesheet" href={stylesheetHref} />
					))}

					{head}

					<link rel="canonical" href={canonical} />

					{hasImportMap ? <ImportMap value={importMap} /> : null}
					{preloads.map((preloadHref) => (
						<link key={preloadHref} rel="modulepreload" href={preloadHref} />
					))}
					<script async type="module" src={href} />
				</head>
				<body>{children}</body>
			</html>
		)
	}
}
