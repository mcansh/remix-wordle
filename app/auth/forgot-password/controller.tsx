import type { Controller } from "remix/fetch-router"

import { Document } from "../../components/document"
import { createPasswordResetToken } from "../../models/user"
import { routes } from "../../routes"
import { render } from "../../utils/render"

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

		async action({ get, url }) {
			let formData = get(FormData)
			let email = formData.get("email")?.toString() ?? ""
			let token = createPasswordResetToken(email)

			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
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
