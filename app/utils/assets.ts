import * as path from "node:path"

import { createAssetServer } from "remix/assets"

import { env } from "../env.ts"
import { assetsBase } from "../routes.ts"

const isDevelopment = env.NODE_ENV === "development"

export const assetServer = createAssetServer({
	rootDir: path.resolve(import.meta.dirname, "../.."),
	allow: ["app/assets/**", "node_modules/.pnpm/**", "app/routes.ts"],
	fileMap: {
		[`${assetsBase}/app/*path`]: "app/*path",
		[`${assetsBase}/node_modules/*path`]: "node_modules/.pnpm/*path",
	},
	scripts: {
		sourceMaps: isDevelopment ? "external" : undefined,
		minify: !isDevelopment,
		define: {
			"process.env.NODE_ENV": JSON.stringify(env.NODE_ENV),
		},
	},
	fingerprint: isDevelopment
		? undefined
		: { buildId: process.env.GITHUB_SHA || String(Date.now()) },
	watch: isDevelopment,
})
