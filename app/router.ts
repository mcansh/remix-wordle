import { asyncContext } from "remix/middleware/async-context"
import { compression } from "remix/middleware/compression"
import { csp } from "remix/middleware/csp"
import { formData } from "remix/middleware/form-data"
import { logger } from "remix/middleware/logger"
import { methodOverride } from "remix/middleware/method-override"
import { session } from "remix/middleware/session"
import { staticFiles } from "remix/middleware/static"
import type { RouterContext } from "remix/router"
import { createRouter } from "remix/router"

import { auth } from "./controllers/auth/controller.tsx"
import { forgotPasswordController } from "./controllers/auth/forgot-password/controller.tsx"
import { loginController } from "./controllers/auth/login/controller.tsx"
import { registerController } from "./controllers/auth/register/controller.tsx"
import { resetPasswordController } from "./controllers/auth/reset-password/controller.tsx"
import { health } from "./controllers/health.tsx"
import { history } from "./controllers/history/controller.tsx"
import { home } from "./controllers/home/controller.tsx"
import { robots } from "./controllers/robots.ts"
import { sitemap } from "./controllers/sitemap.ts"
import { loadAuth } from "./middleware/auth.ts"
import { htmlRobotsTag } from "./middleware/robots.ts"
import { securityHeaders } from "./middleware/security.ts"
import { routes } from "./routes.ts"
import { sessionCookie, sessionStorage } from "./utils/session.ts"

export const router = createRouter({
	middleware: [
		logger(),
		compression(),
		staticFiles("./dist/client/assets", {
			cacheControl: "public, max-age=31536000, immutable",
		}),
		staticFiles("./dist/client", {
			cacheControl: "public, max-age=3600",
		}),
		formData(),
		methodOverride(),
		session(sessionCookie, sessionStorage),
		asyncContext(),
		csp({
			policy({ nonce }) {
				return {
					defaultSrc: ["'none'"],
					scriptSrc: ["'self'", `'nonce-${nonce}'`],
					connectSrc: ["'self'", ...(process.env.NODE_ENV === "development" ? ["ws"] : [])],
					styleSrc: ["'self'"],
					imgSrc: ["'self'", "https://cdn.usefathom.com"],
				}
			},
		}),
		securityHeaders({
			"X-Content-Type-Options": "nosniff",
			"X-DNS-Prefetch-Control": "on",
			"X-Frame-Options": "DENY",
			"X-XSS-Protection": "1; mode=block",
			"Strict-Transport-Security": true,
			"Referrer-Policy": "strict-origin-when-cross-origin",
		}),
		htmlRobotsTag(),
		loadAuth(),
	],
})

export type AppContext = RouterContext<typeof router>

declare module "remix" {
	interface RouterTypes {
		context: AppContext
	}
}

router.map(routes.home, home)
router.map(routes.history, history)
router.map(routes.auth, auth)
router.map(routes.auth.login, loginController)
router.map(routes.auth.register, registerController)
router.map(routes.auth.forgotPassword, forgotPasswordController)
router.map(routes.auth.resetPassword, resetPasswordController)
router.map(routes.health, health)
router.map(routes.robots, robots)
router.map(routes.sitemap, sitemap)
