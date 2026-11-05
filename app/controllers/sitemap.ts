import type { BuildAction } from "remix/fetch-router"

import { SITE_URL } from "#app/constants.ts"
import { routes } from "#app/routes.ts"

export const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

export const sitemap = {
	middleware: [],
	handler() {
		return new Response(SITEMAP_XML, {
			headers: { "Content-Type": "application/xml; charset=utf-8" },
		})
	},
} satisfies BuildAction<"GET", typeof routes.sitemap>
