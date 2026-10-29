import { revalidate } from "pitlane/vite-plugin-remix/hmr"
import { run } from "remix/component"

const app = run({
	async loadModule(moduleUrl, exportName) {
		let mod = await import(/* @vite-ignore */ moduleUrl)
		return mod[exportName]
	},
	async resolveFrame(src) {
		let response = await fetch(new URL(src, location.href))
		return await response.text()
	},
})

app.ready().catch((error) => {
	console.error("Frame adoption failed:", error)
})

if (import.meta.hot) {
	import.meta.hot.on("server:update", () => revalidate(app))
}
