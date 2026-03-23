import { routes } from "../routes"

export function ForgotPasswordPage() {
	return () => {
		return (
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
		)
	}
}
