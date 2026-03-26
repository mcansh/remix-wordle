import { routes } from "../../routes";

export function ResetPasswordForm() {
  return ({ error, token }: { error?: unknown; token: string }) => {
    return (
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
    );
  };
}
