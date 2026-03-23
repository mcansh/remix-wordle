import { NONCE, NONE, SELF } from "@mcansh/http-helmet";
import { asyncContext } from "remix/async-context-middleware";
import { createRouter } from "remix/fetch-router";
import { formData } from "remix/form-data-middleware";
import { logger } from "remix/logger-middleware";
import { methodOverride } from "remix/method-override-middleware";
import { session } from "remix/session-middleware";

import { auth } from "./auth.tsx";
import { health } from "./health.tsx";
import { history } from "./history.tsx";
import { home } from "./home/controller.tsx";
import { createSecurityHeadersMiddleware } from "./middleware/security-headers.ts";
import { routes } from "./routes.ts";
import { sessionCookie, sessionStorage } from "./utils/session.ts";

let middleware = []

if (process.env.NODE_ENV === "development") {
	middleware.push(logger())
}

middleware.push(asyncContext())
middleware.push(formData())
middleware.push(methodOverride())
middleware.push(session(sessionCookie, sessionStorage))
middleware.push(asyncContext())

middleware.push(
	createSecurityHeadersMiddleware({
		fn: (nonce) => {
			return {
				"Content-Security-Policy": {
					"default-src": [NONE],
					"script-src": [SELF, NONCE(nonce)],
					"connect-src": [SELF, ...(import.meta.env.DEV ? ["ws"] : [])],
					"style-src": [SELF, NONCE(nonce)],
					"img-src": [SELF],
				},
				"X-Content-Type-Options": "nosniff",
				"X-DNS-Prefetch-Control": "on",
				"X-Frame-Options": "DENY",
				"X-XSS-Protection": "1; mode=block",
				"Strict-Transport-Security": true,
				"Referrer-Policy": "strict-origin-when-cross-origin",
			}
		},
	}),
)

export let router = createRouter({ middleware })

router.map(routes.home, home)
router.map(routes.history, history)
router.map(routes.auth, auth)
router.map(routes.health, health)
