import { Result, UnhandledException } from "better-result"
import { completeAuth, verifyCredentials } from "remix/auth"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { flashLoginRequestError } from "#/app/controllers/auth/flash.ts"
import { Document } from "#app/components/document.tsx"
import { getPostAuthRedirect, getReturnToQuery, passwordProvider } from "#app/middleware/auth.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

export const loginController = {
	actions: {
		async action(context) {
			let userResult = await Result.tryPromise({
				try: () => verifyCredentials(passwordProvider, context),
				catch: (error) => new UnhandledException({ cause: error }),
			})

			if (userResult.isErr()) {
				console.error(userResult.error)
				return flashLoginRequestError(context.get(Session), context.url)
			}

			if (userResult.value == null) {
				let session = context.get(Session)
				session.flash("error", "Invalid email or password. Please try again.")
				return redirect(routes.auth.login.index.href(undefined, getReturnToQuery(context.url)))
			}

			let sessionResult = Result.try({
				try: () => completeAuth(context),
				catch: (error) => new UnhandledException({ cause: error }),
			})

			if (sessionResult.isErr()) {
				console.error(sessionResult.error)
				return flashLoginRequestError(context.get(Session), context.url)
			}

			let session = sessionResult.value
			session.set("auth", { userId: userResult.value.id })

			return redirect(getPostAuthRedirect(context.url))
		},
		index(context) {
			let session = context.get(Session)
			let error = session.get("error")
			let formAction = routes.auth.login.action.href(undefined, {
				returnTo: context.url.searchParams.get("returnTo"),
			})

			return render(
				<Document url={context.url} head={<title>Login - Remix Wordle</title>}>
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
	},
} satisfies Controller<typeof routes.auth.login>
