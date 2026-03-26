import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "../../components/document"
import { resetPassword } from "../../models/user"
import { routes } from "../../routes"
import { render } from "../../utils/render"
import { ResetPasswordConfirmed } from "./confirmed-page"
import { ResetPasswordForm } from "./reset-page"

export const resetPasswordController = {
	actions: {
		index({ get, params, url }) {
			let session = get(Session)
			let token = params.token
			let error = session.get("error")

			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
					<ResetPasswordForm token={token} error={error} />
				</Document>,
			)
		},

		async action({ get, params, url }) {
			let session = get(Session)
			let formData = get(FormData)
			let password = formData.get("password")?.toString() ?? ""
			let confirmPassword = formData.get("confirmPassword")?.toString() ?? ""

			if (password !== confirmPassword) {
				session.flash("error", "Passwords do not match.")
				return redirect(routes.auth.resetPassword.index.href({ token: params.token }))
			}

			let success = resetPassword(params.token, password)

			if (!success) {
				session.flash("error", "Invalid or expired reset token.")
				return redirect(routes.auth.resetPassword.index.href({ token: params.token }))
			}

			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
					<ResetPasswordConfirmed />
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.auth.resetPassword>
