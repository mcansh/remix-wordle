import * as s from "remix/data-schema"
import { minLength } from "remix/data-schema/checks"
import * as f from "remix/data-schema/form-data"
import type { Controller } from "remix/fetch-router"
import { Session } from "remix/session"

import { flashResetPasswordError } from "#/app/controllers/auth/flash.ts"
import { Document } from "#app/components/document.tsx"
import { resetPassword } from "#app/models/user.ts"
import { routes } from "#app/routes.ts"
import { render } from "#app/utils/render.ts"

import { ResetPasswordConfirmed } from "./confirmed-page"
import { ResetPasswordForm } from "./reset-page"

export const resetPasswordController = {
	actions: {
		index(context) {
			let session = context.get(Session)
			let token = context.params.token
			let error = session.get("error")

			return render(
				<Document url={context.url} head={<title>Login - Remix Wordle</title>}>
					<ResetPasswordForm token={token} error={error} />
				</Document>,
			)
		},

		async action(context) {
			let formData = context.get(FormData)

			let schema = f.object({
				password: f.field(s.string().pipe(minLength(8))),
				confirmPassword: f.field(s.string().pipe(minLength(8))),
			})

			let result = s.parseSafe(schema, formData)

			if (result.success === false) {
				return flashResetPasswordError(
					context.get(Session),
					context.params.token,
					"Password must be at least 8 characters long.",
				)
			}

			if (result.value.password !== result.value.confirmPassword) {
				return flashResetPasswordError(
					context.get(Session),
					context.params.token,
					"Passwords do not match.",
				)
			}

			let success = resetPassword(context.params.token, result.value.password)

			if (!success) {
				return flashResetPasswordError(
					context.get(Session),
					context.params.token,
					"Invalid or expired reset token.",
				)
			}

			return render(
				<Document url={context.url} head={<title>Login - Remix Wordle</title>}>
					<ResetPasswordConfirmed />
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.auth.resetPassword>
