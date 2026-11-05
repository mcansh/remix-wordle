import type { Handle, RemixNode } from "remix/component"
import { ImportMap } from "remix/component/server"

import { scriptEntry, stylesheets } from "#app/assets.ts"
import { ROBOTS_NOINDEX, SITE_DESCRIPTION, SITE_TITLE } from "#app/constants.ts"

import appStylesHref from "#app/app.css?url"

type DocumentProps = {
	children: RemixNode
	url: URL
	head?: RemixNode
	robots?: string
	canonical?: string
}

export function Document(handle: Handle<DocumentProps>) {
	return () => {
		let { children, url, head, robots = ROBOTS_NOINDEX, canonical } = handle.props
		let canonicalHref = canonical ?? url.origin + url.pathname
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta name="robots" content={robots} />
					<meta name="description" content={SITE_DESCRIPTION} />
					<link rel="stylesheet" href={appStylesHref} />
					{stylesheets.map((href) => (
						<link key={href} rel="stylesheet" href={href} />
					))}

					{head ?? <title>{SITE_TITLE}</title>}

					<link rel="canonical" href={canonicalHref} />
					<ImportMap value={scriptEntry.importMap} />
					{scriptEntry.preloads.map((href) => (
						<link key={href} rel="modulepreload" href={href} />
					))}
					<script async type="module" src={scriptEntry.href} />
				</head>
				<body>{children}</body>
			</html>
		)
	}
}
