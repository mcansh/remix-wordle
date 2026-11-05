import { createRedirectResponse as redirect } from "remix/response/redirect"
import type { Controller } from "remix/router"

import { loadAuth } from "#app/middleware/auth.ts"
import { routes } from "#app/routes.ts"

export const auth = {
	middleware: [loadAuth()],
	actions: {
		logout(context) {
			let session = context.session
			session.destroy()
			return redirect(routes.home.index.href())
		},
	},
} satisfies Controller<typeof routes.auth>
