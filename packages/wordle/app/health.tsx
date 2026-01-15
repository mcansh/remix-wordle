import type { BuildAction } from "@remix-run/fetch-router"

import { db } from "./db.ts"
import { routes } from "./routes.ts"

export const health = {
	middleware: [],
	async action({ headers }) {
		let host = headers.get("X-Forwarded-Host") ?? headers.get("host")

		try {
			let url = new URL("/", `http://${host}`)
			// if we can connect to the database and make a simple query
			// and make a HEAD request to ourselves, then we're good.
			await Promise.all([
				db.user.count(),
				fetch(url.toString(), { method: "HEAD" }).then((r) => {
					if (!r.ok) return Promise.reject(r)
				}),
			])
			return new Response("OK")
		} catch (error: unknown) {
			console.log("healthcheck ❌", { error })
			return new Response("ERROR", { status: 500 })
		}
	},
} satisfies BuildAction<"GET", typeof routes.health>
