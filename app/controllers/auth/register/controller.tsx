import { parseSafe } from "remix/data-schema"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

import { Button } from "#app/components/button.tsx"
import { Document } from "#app/components/document.tsx"
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "#app/components/field.tsx"
import { Input } from "#app/components/input.tsx"
import { createUser, getUserByEmail, joinSchema } from "#app/models/user.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

export const registerController = {
	actions: {
		index(context) {
			let session = context.get(Session)
			let error = session.get("error")

			return render(
				<Document url={context.url} head={<title>Register - Remix Wordle</title>}>
					<main class="mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center space-y-6">
						<form
							method="POST"
							action={routes.auth.register.action.href()}
							class="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center space-y-6 px-8"
						>
							{error && typeof error === "string" ? (
								<div className="mb-4 text-red-500">
									<FieldError errors={[{ message: error }]} />
								</div>
							) : null}
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<FieldContent>
										<Input
											id="email"
											autoFocus={true}
											name="email"
											type="email"
											autoComplete="email"
										/>
									</FieldContent>
								</Field>
							</FieldGroup>

							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="username">Username</FieldLabel>
									<FieldContent>
										<Input
											id="username"
											autoFocus={true}
											name="username"
											type="text"
											autoComplete="username"
										/>
									</FieldContent>
								</Field>
							</FieldGroup>

							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="password">Password</FieldLabel>
									<FieldContent>
										<Input
											id="password"
											autoFocus={true}
											name="password"
											type="password"
											autoComplete="new-password"
										/>
									</FieldContent>
								</Field>
							</FieldGroup>

							<Button type="submit" class="w-full">
								Join now
							</Button>

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
			let result = parseSafe(joinSchema, formData)

			if (result.success === false) {
				session.flash("error", "Invalid form data. Please check your input and try again.")
				return redirect(routes.auth.register.index.href())
			}

			if (await getUserByEmail(result.value.email)) {
				session.flash("error", "An account with this email already exists.")
				return redirect(routes.auth.register.index.href())
			}

			let user = await createUser({
				email: result.value.email,
				username: result.value.username,
				password: result.value.password,
			})

			session.set("auth", { auth: user.id })

			return redirect(routes.home.index.href())
		},
	},
} satisfies Controller<typeof routes.auth.register>
