import { parse } from "remix/data-schema"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Document } from "../../components/document"
import { authenticateUser, loginSchema } from "../../models/user"
import { routes } from "../../routes"
import { render } from "../../utils/render"

export const loginController = {
	actions: {
		index({ get, url }) {
			let session = get(Session)
			let error = session.get("error")
			let formAction = routes.auth.login.action.href(undefined, {
				returnTo: url.searchParams.get("returnTo"),
			})

			return render(
				<Document url={url} head={<title>Login - Remix Wordle</title>}>
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
			)
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
} satisfies Controller<typeof routes.auth.login>
