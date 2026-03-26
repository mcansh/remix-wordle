import { parse } from "remix/data-schema"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "../../components/document"
import { createUser, getUserByEmail, joinSchema } from "../../models/user"
import { routes } from "../../routes"
import { render } from "../../utils/render"

export const registerController = {
	actions: {
		index({ url }) {
			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
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
			)
		},

		async action({ get, url }) {
			let session = get(Session)
			let formData = get(FormData)
			let result = parse(joinSchema, formData)

			// Check if user already exists
			if (await getUserByEmail(result.email)) {
				return render(
					<Document url={url} head={<title>Login - Remix Wordle</title>}>
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
} satisfies Controller<typeof routes.auth.register>
