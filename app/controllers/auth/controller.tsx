import type { Controller } from "remix/fetch-router"
import { createRedirectResponse as redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { loadAuth } from "../../middleware/auth.ts"
import { routes } from "../../routes.ts"
import { forgotPasswordController } from "./forgot-password/controller.tsx"
import { loginController } from "./login/controller.tsx"
import { registerController } from "./register/controller.tsx"
import { resetPasswordController } from "./reset-password/controller.tsx"

export const auth = {
	middleware: [loadAuth()],
	actions: {
		login: loginController,

		register: registerController,

		logout({ get }) {
			let session = get(Session)
			session.destroy()
			return redirect(routes.home.index.href())
		},

		forgotPassword: forgotPasswordController,

		resetPassword: resetPasswordController,
	},
} satisfies Controller<typeof routes.auth>
