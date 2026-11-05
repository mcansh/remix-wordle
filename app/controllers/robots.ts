import type { Action } from "remix/router"

import { SITE_ORIGIN } from "#app/constants.ts"
import { routes } from "#app/routes.ts"

export const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`

export const robots = {
	middleware: [],
	handler() {
		return new Response(ROBOTS_TXT, {
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		})
	},
} satisfies Action<typeof routes.robots>
