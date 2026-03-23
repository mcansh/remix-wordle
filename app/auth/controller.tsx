import { parse } from "remix/data-schema"
import type { Controller } from "remix/fetch-router"
import { createRedirectResponse as redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { loadAuth } from "../middleware/auth.ts"
import {
	authenticateUser,
	createPasswordResetToken,
	createUser,
	getUserByEmail,
	joinSchema,
	loginSchema,
	resetPassword,
} from "../models/user.ts"
import { routes } from "../routes.ts"
import { renderDocument } from "../utils/render.tsx"
import { ForgotPasswordPage } from "./forgot-password-page.tsx"
import { LoginPage } from "./login-page.tsx"
import { RegisterPage } from "./register-page.tsx"

export const auth = {
	middleware: [loadAuth()],
	actions: {
		login: {
			actions: {
				index({ get, url }) {
					let session = get(Session)
					let error = session.get("error")
					let errorMessage = typeof error === "string" ? error : null
					let formAction = routes.auth.login.action.href(undefined, {
						returnTo: url.searchParams.get("returnTo"),
					})

					return renderDocument(<LoginPage error={errorMessage} formAction={formAction} />)
				},

				async action({ get, url }) {
					let session = get(Session)
					let formData = get(FormData)
					let result = parse(loginSchema, formData)
					let returnTo = url.searchParams.get("returnTo")

					let user = await authenticateUser(result.email, result.password)
					if (!user) {
						session.flash("error", "Invalid email or password. Please try again.")
						return redirect(routes.auth.login.index.href(undefined, { returnTo }))
					}

					session.set("userId", user.id)

					return redirect(returnTo ?? routes.home.index.href())
				},
			},
		},

		register: {
			actions: {
				index() {
					return renderDocument(<RegisterPage formAction={routes.auth.register.action.href()} />)
				},

				async action({ get }) {
					let session = get(Session)
					let formData = get(FormData)
					let result = parse(joinSchema, formData)

					// Check if user already exists
					if (await getUserByEmail(result.email)) {
						return renderDocument(
							<div class="card" style="max-width: 500px; margin: 2rem auto;">
								<div class="alert alert-error">An account with this email already exists.</div>
								<p>
									<a href={routes.auth.register.index.href()} class="btn">
										Back to Register
									</a>
									<a
										href={routes.auth.login.index.href()}
										class="btn btn-secondary"
										style="margin-left: 0.5rem;"
									>
										Login
									</a>
								</p>
							</div>,
							{ status: 400 },
						)
					}

					let user = await createUser({
						email: result.email,
						username: result.username,
						password: result.password,
					})

					session.set("userId", user.id)

					return redirect(routes.home.index.href())
				},
			},
		},

		logout({ get }) {
			let session = get(Session)
			session.destroy()
			return redirect(routes.home.index.href())
		},

		forgotPassword: {
			actions: {
				index() {
					return renderDocument(<ForgotPasswordPage />)
				},

				async action({ get }) {
					let formData = get(FormData)
					let email = formData.get("email")?.toString() ?? ""
					let token = createPasswordResetToken(email)

					return renderDocument(
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
						</div>,
					)
				},
			},
		},

		resetPassword: {
			actions: {
				index({ get, params }) {
					let session = get(Session)
					let token = params.token
					let error = session.get("error")

					return renderDocument(
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
						</div>,
					)
				},

				async action({ get, params }) {
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

					return renderDocument(
						<div class="card" style="max-width: 500px; margin: 2rem auto;">
							<div class="alert alert-success">
								Password reset successfully! You can now login with your new password.
							</div>
							<p>
								<a href={routes.auth.login.index.href()} class="btn">
									Login
								</a>
							</p>
						</div>,
					)
				},
			},
		},
	},
} satisfies Controller<typeof routes.auth>
