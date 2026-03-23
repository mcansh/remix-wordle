import "@mcansh/vite-plugin-remix/types"
import { mergeAssets } from "@mcansh/vite-plugin-remix/runtime"
import type { RemixNode } from "remix/component"

import clientAssets from "../entry.browser.ts?assets=client"
import serverAssets from "../entry.server.tsx?assets=ssr"

import appStylesHref from "../app.css?url"

const assets = mergeAssets(clientAssets, serverAssets)

export function Document() {
	return ({ children, nonce }: { children: RemixNode; nonce: string }) => {
		return (
			<html lang="en">
				<head>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<link rel="stylesheet" href={appStylesHref} nonce={nonce} />
					{assets.css.map((attrs) => (
						<link key={attrs.href} {...attrs} rel="stylesheet" nonce={nonce} />
					))}
				</head>
				<body>
					{children}
					{assets.js.map((attrs) => (
						<link key={attrs.href} {...attrs} rel="modulepreload" nonce={nonce} />
					))}
					<script async type="module" src={clientAssets.entry} nonce={nonce} />
				</body>
			</html>
		)
	}
}
