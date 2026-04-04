import * as s from "remix/data-schema"
import * as f from "remix/data-schema/form-data"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "#app/components/document.tsx"
import { resetPassword } from "#app/models/user.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

export const resetPasswordController = {
	actions: {
		index(context) {
			let session = context.get(Session)
			let token = context.params.token
			let error = session.get("error")

			return render(
				<Document url={context.url} head={<title>Reset Password - Remix Wordle</title>}>
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

		async action(context) {
			let session = context.get(Session)
			let formData = context.get(FormData)

			let resetPasswordSchema = f.object({
				password: f.field(s.string()),
				confirmPassword: f.field(s.string()),
			})

			let parsed = s.parse(resetPasswordSchema, formData)

			if (parsed.password !== parsed.confirmPassword) {
				session.flash("error", "Passwords do not match.")
				return redirect(routes.auth.resetPassword.index.href({ token: context.params.token }))
			}

			let success = resetPassword(context.params.token, parsed.password)

			if (!success) {
				session.flash("error", "Invalid or expired reset token.")
				return redirect(routes.auth.resetPassword.index.href({ token: context.params.token }))
			}

			return render(
				<Document url={context.url} head={<title>Reset Password - Remix Wordle</title>}>
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
