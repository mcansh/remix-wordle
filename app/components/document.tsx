import "@mcansh/vite-plugin-remix/types"
import type { RemixNode } from "remix/ui"

import { ROBOTS_NOINDEX } from "#app/constants.ts"
import clientAssets from "#app/entry.browser.ts?assets=client"
import serverAssets from "#app/entry.server.ts?assets=ssr"

import appStylesHref from "#app/app.css?url"

const assets = clientAssets.merge(serverAssets)

export function Document() {
	return ({
		children,
		url,
		head,
		robots = ROBOTS_NOINDEX,
		canonical,
	}: {
		children: RemixNode
		head?: RemixNode
		url: URL
		robots?: string
		canonical?: string
	}) => {
		let canonicalHref = canonical ?? url.origin + url.pathname
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta name="robots" content={robots} />
					<link rel="stylesheet" href={appStylesHref} />
					{assets.css.map((attrs) => (
						<link key={attrs.href} {...attrs} rel="stylesheet" />
					))}

					{head}

					<link rel="canonical" href={canonicalHref} />
				</head>
				<body>
					{children}

					{assets.js.map((attrs) => (
						<link key={attrs.href} {...attrs} rel="modulepreload" />
					))}
					<script async type="module" src={clientAssets.entry} />
				</body>
			</html>
		)
	}
}
