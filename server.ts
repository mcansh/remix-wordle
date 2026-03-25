import * as http from "node:http"
import { createRequestListener } from "remix/node-fetch-server"

// @ts-expect-error - no types for this
import ssr from "./dist/ssr/entry.server.js"

let server = http.createServer(
	createRequestListener(async (request) => {
		try {
			return await ssr.fetch(request)
		} catch (error) {
			console.error(error)
			return new Response("Internal Server Error", { status: 500 })
		}
	}),
)

let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 44100

server.listen(port, () => {
	console.log(`✅ App is running on http://localhost:${port}`)
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
