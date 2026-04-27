import type { RemixNode } from "remix/component"
import { RMX_01, RMX_01_GLYPHS } from "remix/ui/theme"

import { getAssetEntry } from "../middleware/asset-entry.ts"

export function Document() {
	return ({
		children,
		head,
		url,
	}: {
		children: RemixNode
		head?: RemixNode
		url: URL
	}) => {
		let { src, preloads } = getAssetEntry()
		let canonical = url.origin + url.pathname
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="stylesheet" href="/app.css" />
					{head}
					<RMX_01 />
					<RMX_01_GLYPHS />
					<link rel="canonical" href={canonical} />
					{preloads.map((href) => (
						<link key={href} rel="modulepreload" href={href} />
					))}
					<script type="module" async src={src} />
				</head>
				<body>{children}</body>
			</html>
		)
	}
}
