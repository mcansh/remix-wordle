import { revalidate } from "pitlane/vite-plugin-remix/hmr"
import { run } from "remix/component"

import "#app/app.css"

const app = run({
	async loadModule(moduleUrl, exportName) {
		let hrefs = moduleUrl.startsWith("[") ? (JSON.parse(moduleUrl) as Array<string>) : [moduleUrl]
		let [mod] = await Promise.all(hrefs.map((href) => import(/* @vite-ignore */ href)))
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
	import.meta.hot.accept()
}
