import { redirect } from "remix/response/redirect"
import type { Session } from "remix/session"

import { getReturnToQuery } from "#app/middleware/auth.ts"
import { routes } from "#app/routes.ts"

export function flashLoginRequestError(session: Session, url: URL) {
	session.flash("error", "We could not complete that sign-in request.")
	return redirect(routes.auth.login.index.href(undefined, getReturnToQuery(url)))
}

export function flashRegisterError(session: Session, message: string) {
	session.flash("error", message)
	return redirect(routes.auth.register.index.href())
}

export function flashResetPasswordError(session: Session, token: string, message: string) {
	session.flash("error", message)
	return redirect(routes.auth.resetPassword.index.href({ token }))
}
