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
import { loadAuth } from "./middleware/auth.ts"
import { securityHeaders } from "./middleware/security.ts"
import { routes } from "./routes.ts"
import { sessionCookie, sessionStorage } from "./utils/session.ts"

let middleware = []

if (process.env.NODE_ENV === "development") {
	middleware.push(logger())
}

middleware.push(compression())
middleware.push(
	staticFiles("./dist/client/assets", {
		cacheControl: "public, max-age=31536000, immutable",
	}),
)
middleware.push(
	staticFiles("./dist/client", {
		cacheControl: "public, max-age=3600",
	}),
)
middleware.push(formData())
middleware.push(methodOverride())
middleware.push(session(sessionCookie, sessionStorage))
middleware.push(asyncContext())
middleware.push(
	securityHeaders({
		"Content-Security-Policy": {
			"default-src": [NONE],
			"script-src": [SELF],
			"connect-src": [SELF, ...(import.meta.env.DEV ? ["ws"] : [])],
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

export let router = createRouter({ middleware })

router.map(routes.home, home)
router.map(routes.history, history)
router.map(routes.auth, auth)
router.map(routes.health, health)
