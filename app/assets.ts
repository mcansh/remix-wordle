import { createAssetResolver, type ScriptEntry } from "pitlane/assets"
import manifest from "pitlane/assets/manifest"

export const assets = createAssetResolver(manifest)

const unavailableScriptEntry: ScriptEntry = {
	href: "/entry.browser.js",
	preloads: [],
	importMap: { imports: {} },
}

export const scriptEntry: ScriptEntry =
	manifest.mode === "unavailable"
		? unavailableScriptEntry
		: await assets.getScriptEntry("app/entry.browser.ts")

export const stylesheets: Array<string> =
	manifest.mode === "unavailable"
		? []
		: await assets.getStylesheets(["app/entry.server.ts", "app/entry.browser.ts"])
