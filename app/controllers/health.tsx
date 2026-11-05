import type { Action } from "remix/router"

import type { routes } from "#app/routes.ts"
import { db } from "#app/utils/db.ts"

export const health = {
	middleware: [],
	async handler({ headers }) {
		let host = headers.get("X-Forwarded-Host") ?? headers.get("Host")

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
} satisfies Action<typeof routes.health>
