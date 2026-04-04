import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "#app/components/document.tsx"
import { createUser, getUserByEmail, joinSchema } from "#app/models/user.ts"
import { routes } from "#app/routes.ts"
import { parse } from "#app/utils/local-schema.ts"
import { render } from "#app/utils/render.ts"

export const registerController = {
	actions: {
		index(context) {
			let session = context.get(Session)
			let error = session.get("error")

			return render(
				<Document url={context.url} head={<title>Register - Remix Wordle</title>}>
					<main class="h-dvh">
						<form
							method="POST"
							action={routes.auth.register.action.href()}
							class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
						>
							{error && typeof error === "string" ? (
								<div class="w-full text-center text-red-500">{error}</div>
							) : null}
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

		async action(context) {
			let session = context.get(Session)
			let formData = context.get(FormData)
			let result = parse(joinSchema, formData)

			if (await getUserByEmail(result.email)) {
				session.flash("error", "An account with this email already exists.")
				return redirect(routes.auth.register.index.href())
			}

			let user = await createUser({
				email: result.email,
				username: result.username,
				password: result.password,
			})

			session.set("auth", { auth: user.id })

			return redirect(routes.home.index.href())
		},
	},
} satisfies Controller<typeof routes.auth.register>
