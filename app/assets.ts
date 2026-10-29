import { createAssetResolver } from "pitlane/assets"
import manifest from "pitlane/assets/manifest"

export const assets = createAssetResolver(manifest)

export const assetManifestAvailable = manifest.mode !== "unavailable"

// Literal resolver calls must stay in source so the plugin registers the entry.
// When the manifest is unavailable (Vitest/tsc), those methods reject.
export const scriptEntry = assetManifestAvailable
	? await assets.getScriptEntry("app/entry.browser.ts")
	: {
			href: "/app/entry.browser.ts",
			preloads: [] as Array<string>,
			importMap: { imports: {} },
		}

export const stylesheets = assetManifestAvailable
	? await assets.getStylesheets("app/entry.server.ts")
	: []
