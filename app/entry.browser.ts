import { run } from "remix/ui"

const app = run({
	async loadModule(moduleUrl, exportName) {
		let chunks = JSON.parse(moduleUrl) as string[]
		let [mod] = await Promise.all(chunks.map((chunk) => import(/* @vite-ignore */ chunk)))
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
	import.meta.hot.accept()
}
