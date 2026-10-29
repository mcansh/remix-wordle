import { NONE, SELF } from "@mcansh/http-helmet"
import { asyncContext } from "remix/middleware/async-context"
import { compression } from "remix/middleware/compression"
import { formData } from "remix/middleware/form-data"
import { logger } from "remix/middleware/logger"
import { methodOverride } from "remix/middleware/method-override"
import { session } from "remix/middleware/session"
import { staticFiles } from "remix/middleware/static"
import { createRouter } from "remix/router"

import { auth } from "./controllers/auth/controller.tsx"
import { forgotPasswordController } from "./controllers/auth/forgot-password/controller.tsx"
import { loginController } from "./controllers/auth/login/controller.tsx"
import { registerController } from "./controllers/auth/register/controller.tsx"
import { resetPasswordController } from "./controllers/auth/reset-password/controller.tsx"
import { health } from "./controllers/health.tsx"
import { history } from "./controllers/history/controller.tsx"
import { home } from "./controllers/home/controller.tsx"
import { loadAuth } from "./middleware/auth.ts"
import { securityHeaders } from "./middleware/security.ts"
import { routes } from "./routes.ts"
import { sessionCookie, sessionStorage } from "./utils/session.ts"

const middleware = []

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

export const router = createRouter({ middleware })

router.map(routes.home, home)
router.map(routes.history, history)
router.map(routes.auth, auth)
router.map(routes.auth.login, loginController)
router.map(routes.auth.register, registerController)
router.map(routes.auth.forgotPassword, forgotPasswordController)
router.map(routes.auth.resetPassword, resetPasswordController)
router.map(routes.health, health)
