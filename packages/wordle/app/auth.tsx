import type { Controller } from "@remix-run/fetch-router";

import { createRedirectResponse as redirect } from "@remix-run/response/redirect";

import { Document } from "./components/document.tsx";
import { loadAuth } from "./middleware/auth.ts";
import {
  authenticateUser,
  createUser,
  getUserByEmail,
  createPasswordResetToken,
  resetPassword,
  joinSchema,
  loginSchema,
} from "./models/user.ts";
import { routes } from "./routes.ts";
import { render } from "./utils/render.ts";

export const auth = {
  middleware: [loadAuth()],
  actions: {
    login: {
      index({ session, url }) {
        let error = session.get("error");
        let formAction = routes.auth.login.action.href(undefined, {
          returnTo: url.searchParams.get("returnTo"),
        });

        return render(
          <Document>
            <main class="h-dvh">
              {error && typeof error === "string" ? <div class="text-red-500">{error}</div> : null}
              <form
                method="post"
                class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
                action={formAction}
              >
                <div class="w-full">
                  <label htmlFor="email" class="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div class="mt-1">
                    <input
                      id="email"
                      required
                      autoFocus={true}
                      name="email"
                      type="email"
                      autoComplete="email"
                      class="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                    />
                  </div>
                </div>

                <div class="w-full">
                  <label htmlFor="password" class="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div class="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      class="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                  Log in
                </button>
                <div class="text-sm text-gray-500">
                  Don&apos;t have an account?{" "}
                  <a class="text-blue-500 underline" href={routes.auth.register.index.href()}>
                    Sign up
                  </a>
                </div>
              </form>
            </main>
          </Document>,
        );
      },

      async action({ session, formData, url }) {
        let result = loginSchema.parse(Object.fromEntries(formData));
        let returnTo = url.searchParams.get("returnTo");

        let user = await authenticateUser(result.email, result.password);
        if (!user) {
          session.flash("error", "Invalid email or password. Please try again.");
          return redirect(routes.auth.login.index.href(undefined, { returnTo }));
        }

        session.set("userId", user.id);

        return redirect(returnTo ?? routes.home.index.href());
      },
    },

    register: {
      index() {
        return render(
          <Document>
            <main class="h-dvh">
              <form
                method="POST"
                action={routes.auth.register.action.href()}
                class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
              >
                <div class="w-full">
                  <label class="block text-sm font-medium text-gray-700" for="email">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
                  />
                </div>

                <div class="w-full">
                  <label class="block text-sm font-medium text-gray-700" for="username">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    autoComplete="username"
                    class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
                  />
                </div>

                <div class="w-full">
                  <label class="block text-sm font-medium text-gray-700" for="password">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autoComplete="new-password"
                    class="mt-1 w-full rounded border border-gray-500 px-2 py-1 text-lg"
                  />
                </div>

                <button
                  type="submit"
                  class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                  Join now
                </button>

                <p class="text-sm text-gray-500">
                  Already have an account?{" "}
                  <a href={routes.auth.login.index.href()} class="text-blue-500 underline">
                    Login here
                  </a>
                </p>
              </form>
            </main>
          </Document>,
        );
      },

      async action({ session, formData }) {
        let result = joinSchema.parse(Object.fromEntries(formData));

        // Check if user already exists
        if (await getUserByEmail(result.email)) {
          return render(
            <Document>
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
              </div>
            </Document>,
            { status: 400 },
          );
        }

        let user = await createUser({
          email: result.email,
          username: result.username,
          password: result.password,
        });

        session.set("userId", user.id);

        return redirect(routes.home.index.href());
      },
    },

    logout({ session }) {
      session.destroy();
      return redirect(routes.home.index.href());
    },

    forgotPassword: {
      index() {
        return render(
          <Document>
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
        );
      },

      async action({ formData }) {
        let email = formData.get("email")?.toString() ?? "";
        let token = createPasswordResetToken(email);

        return render(
          <Document>
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
        );
      },
    },

    resetPassword: {
      index({ params, session }) {
        let token = params.token;
        let error = session.get("error");

        return render(
          <Document>
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
        );
      },

      async action({ session, formData, params }) {
        let password = formData.get("password")?.toString() ?? "";
        let confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

        if (password !== confirmPassword) {
          session.flash("error", "Passwords do not match.");
          return redirect(routes.auth.resetPassword.index.href({ token: params.token }));
        }

        let success = resetPassword(params.token, password);

        if (!success) {
          session.flash("error", "Invalid or expired reset token.");
          return redirect(routes.auth.resetPassword.index.href({ token: params.token }));
        }

        return render(
          <Document>
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
        );
      },
    },
  },
} satisfies Controller<typeof routes.auth>;
