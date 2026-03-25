import "@mcansh/vite-plugin-remix/types"
import type { RemixNode } from "remix/component"

import clientAssets from "../entry.browser.ts?assets=client"
import serverAssets from "../entry.server.tsx?assets=ssr"

import appStylesHref from "../app.css?url"

let assets = clientAssets.merge(serverAssets)

export function Document() {
	return ({ children, url, head }: { children: RemixNode; head?: RemixNode; url: URL }) => {
		let canonical = url.origin + url.pathname
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="stylesheet" href={appStylesHref} />
					{assets.css.map((attrs) => (
						<link key={attrs.href} {...attrs} rel="stylesheet" />
					))}

					{head}

					<link rel="canonical" href={canonical} />
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
