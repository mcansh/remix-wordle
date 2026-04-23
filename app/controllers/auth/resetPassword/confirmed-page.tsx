import { routes } from "../../../routes"

export function ResetPasswordConfirmed() {
	return () => {
		return (
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
		)
	}
}
