import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "../../../components/document"
import { resetPassword } from "../../../models/user"
import { routes } from "../../../routes"
import { render } from "../../../utils/render"

export const resetPasswordController = {
	actions: {
		index({ get, params, url }) {
			let session = get(Session)
			let token = params.token
			let error = session.get("error")

			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
					<div class="card" style="max-width: 500px; margin: 2rem auto;">
						<h1>Reset Password</h1>
						<p>Enter your new password below.</p>

						{typeof error === "string" ? (
							<div class="alert alert-error" style="margin-bottom: 1.5rem;">
								{error}
							</div>
						) : null}

						<form method="POST" action={routes.auth.resetPassword.action.href({ token })}>
							<div>
								<label for="password">New Password</label>
								<input
									type="password"
									id="password"
									name="password"
									required
									autoComplete="new-password"
								/>
							</div>

							<div>
								<label for="confirmPassword">Confirm Password</label>
								<input
									type="password"
									id="confirmPassword"
									name="confirmPassword"
									required
									autoComplete="new-password"
								/>
							</div>

							<button type="submit" class="btn">
								Reset Password
							</button>
						</form>
					</div>
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
					<div class="card" style="max-width: 500px; margin: 2rem auto;">
						<div class="alert alert-success">
							Password reset successfully! You can now login with your new password.
						</div>
						<p>
							<a href={routes.auth.login.index.href()} class="btn">
								Login
							</a>
						</p>
					</div>
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.auth.resetPassword>
