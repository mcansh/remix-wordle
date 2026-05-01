import * as s from "remix/data-schema"
import { minLength } from "remix/data-schema/checks"
import * as f from "remix/data-schema/form-data"
import type { Controller } from "remix/fetch-router"
import { redirect } from "remix/response/redirect"
import { Session } from "remix/session"

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
			let session = context.get(Session)
			let formData = context.get(FormData)

			let schema = f.object({
				password: f.field(s.string().pipe(minLength(8))),
				confirmPassword: f.field(s.string().pipe(minLength(8))),
			})

			let result = s.parseSafe(schema, formData)

			if (result.success === false) {
				session.flash("error", "Password must be at least 8 characters long.")
				return redirect(routes.auth.resetPassword.index.href({ token: context.params.token }))
			}

			if (result.value.password !== result.value.confirmPassword) {
				session.flash("error", "Passwords do not match.")
				return redirect(routes.auth.resetPassword.index.href({ token: context.params.token }))
			}

			let success = resetPassword(context.params.token, result.value.password)

			if (!success) {
				session.flash("error", "Invalid or expired reset token.")
				return redirect(routes.auth.resetPassword.index.href({ token: context.params.token }))
			}

			return render(
				<Document url={context.url} head={<title>Login - Remix Wordle</title>}>
					<ResetPasswordConfirmed />
				</Document>,
			)
		},
	},
} satisfies Controller<typeof routes.auth.resetPassword>
