import { createRequestListener } from "@remix-run/node-fetch-server"
import express from "express"

// @ts-expect-error - no types for this
import ssr from "./dist/ssr/entry.server.js"

const app = express()

if (process.env.NODE_ENV === "development") {
	let middleware = await import("./mocks/server.ts")
	app.use(middleware.middleware)
}

app.use(
	"/assets",
	express.static("dist/client/assets", {
		maxAge: "1y",
		immutable: true,
	}),
)
app.use(express.static("dist/client", { maxAge: "5m" }))

app.use(createRequestListener(ssr.fetch))

const port = Number.parseInt(process.env.PORT || "44100")
const server = app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`)
})

let shuttingDown = false

function shutdown() {
	if (shuttingDown) return
	shuttingDown = true
	server.close(() => {
		process.exit(0)
	})
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
