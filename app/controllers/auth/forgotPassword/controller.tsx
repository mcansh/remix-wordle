import * as s from "remix/data-schema"
import { email } from "remix/data-schema/checks"
import * as f from "remix/data-schema/form-data"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "#app/components/document.tsx"
import { createPasswordResetToken } from "#app/models/user.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

export const forgotPasswordController = {
	actions: {
		index({ url }) {
			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
					<div class="card" style="max-width: 500px; margin: 2rem auto;">
						<h1>Forgot Password</h1>
						<p>Enter your email address and we'll send you a link to reset your password.</p>

						<form method="POST" action={routes.auth.forgotPassword.action.href()}>
							<div>
								<label for="email">Email</label>
								<input type="email" id="email" name="email" required autoComplete="email" />
							</div>

							<button type="submit" class="btn">
								Send Reset Link
							</button>
						</form>

						<p style="margin-top: 1.5rem;">
							<a href={routes.auth.login.index.href()}>Back to Login</a>
						</p>
					</div>
				</Document>,
			)
		},

		async action(context) {
			let session = context.get(Session)
			let formData = context.get(FormData)

			let schema = f.object({
				email: f.field(s.string().pipe(email())),
			})

			let result = s.parseSafe(schema, formData)

			if (result.success === false) {
				session.flash("error", "Invalid email address")
				return redirect(routes.auth.forgotPassword.index.href())
			}

			let token = createPasswordResetToken(result.value.email)

			return render(
				<Document url={context.url} head={<title>Login - Remix Wordle</title>}>
					<div class="card" style="max-width: 500px; margin: 2rem auto;">
						<div class="alert alert-success">Password reset link sent! Check your email.</div>

						{token ? (
							<div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
								<p style="font-size: 0.9rem;">
									<strong>Demo Mode:</strong> Click the link below to reset your password
								</p>
								<p style="margin-top: 0.5rem;">
									<a
										href={routes.auth.resetPassword.index.href({ token })}
										class="btn btn-secondary"
									>
										Reset Password
									</a>
								</p>
							</div>
						) : null}

						<p style="margin-top: 1.5rem;">
							<a href={routes.auth.login.index.href()} class="btn">
								Back to Login
							</a>
						</p>
					</div>
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.auth.forgotPassword>
