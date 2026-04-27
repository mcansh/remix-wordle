import type { RemixNode } from "remix/component"

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
		let assets = getAssetEntry()
		let canonical = url.origin + url.pathname
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="stylesheet" href={assets.stylesheetHref} />
					<link rel="canonical" href={canonical} />
					{assets.scriptPreloads.map((href) => {
						return <link key={href} rel="modulepreload" href={href} />
					})}
					<script type="module" async src={assets.scriptSrc} />
					{head}
				</head>
				<body>{children}</body>
			</html>
		)
	}
}
