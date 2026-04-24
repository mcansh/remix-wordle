import { NONE, SELF } from "@mcansh/http-helmet"
import { asyncContext } from "remix/async-context-middleware"
import { compression } from "remix/compression-middleware"
import { createRouter } from "remix/fetch-router"
import { formData } from "remix/form-data-middleware"
import { logger } from "remix/logger-middleware"
import { methodOverride } from "remix/method-override-middleware"
import { session } from "remix/session-middleware"
import { staticFiles } from "remix/static-middleware"

import { auth } from "./controllers/auth/controller.tsx"
import { health } from "./controllers/health.tsx"
import { history } from "./controllers/history/controller.tsx"
import { home } from "./controllers/home/controller.tsx"
import { loadAssetEntry } from "./middleware/asset-entry.ts"
import { loadAuth } from "./middleware/auth.ts"
import { securityHeaders } from "./middleware/security.ts"
import { routes } from "./routes.ts"
import { assetServer } from "./utils/assets.ts"
import { sessionCookie, sessionStorage } from "./utils/session.ts"

const middleware = []

if (process.env.NODE_ENV === "development") {
	middleware.push(logger())
}

middleware.push(compression())
middleware.push(
	staticFiles("./public/build", {
		cacheControl:
			process.env.NODE_ENV === "production"
				? "max-age=31536000, immutable"
				: "no-store, must-revalidate",
	}),
	staticFiles("./public", {
		cacheControl:
			process.env.NODE_ENV === "production"
				? "public, max-age=3600"
				: "no-store, must-revalidate",
	}),
)
middleware.push(formData())
middleware.push(methodOverride())
middleware.push(session(sessionCookie, sessionStorage))
middleware.push(asyncContext())
middleware.push(loadAssetEntry())
middleware.push(
	securityHeaders({
		"Content-Security-Policy": {
			"default-src": [NONE],
			"script-src": [SELF],
			"connect-src": [
				SELF,
				...(process.env.NODE_ENV === "development" ? ["ws"] : []),
			],
			"style-src": [SELF],
			"img-src": [SELF, "https://cdn.usefathom.com"],
		},
		"X-Content-Type-Options": "nosniff",
		"X-DNS-Prefetch-Control": "on",
		"X-Frame-Options": "DENY",
		"X-XSS-Protection": "1; mode=block",
		"Strict-Transport-Security": true,
		"Referrer-Policy": "strict-origin-when-cross-origin",
	}),
)
middleware.push(loadAuth())

export const router = createRouter({ middleware })

router.get(routes.assets, async ({ request }) => {
	let assetResponse = await assetServer.fetch(request)
	return assetResponse ?? new Response("Not found", { status: 404 })
})

router.map(routes.home, home)
router.map(routes.history, history)
router.map(routes.auth, auth)
router.map(routes.health, health)
