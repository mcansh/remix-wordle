import type { Remix } from "@remix-run/dom"

import "@mcansh/vite-plugin-remix/types"
import appStylesHref from "../app.css?url"
import clientAssets from "../entry.browser.ts?assets=client"
import serverAssets from "../entry.server.tsx?assets=ssr"

let assets = clientAssets.merge(serverAssets)

export function Document({ children }: { children: Remix.RemixNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="stylesheet" href={appStylesHref} />
				{assets.css.map((attrs) => (
					<link key={attrs.href} {...attrs} rel="stylesheet" />
				))}
				{assets.js.map((attrs) => (
					<link key={attrs.href} {...attrs} rel="modulepreload" />
				))}
				<script async type="module" src={clientAssets.entry} />
				<script src="https://cdn.usefathom.com/script.js" data-site="LHPWDAMW" defer />
			</head>
			<body>{children}</body>
		</html>
	)
}
