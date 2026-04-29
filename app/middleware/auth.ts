import bcrypt from "bcryptjs"
import { createCredentialsAuthProvider } from "remix/auth"
import {
	auth,
	createSessionAuthScheme,
	requireAuth as requireAuthenticated,
} from "remix/auth-middleware"
import * as s from "remix/data-schema"
import * as f from "remix/data-schema/form-data"
import { redirect } from "remix/response/redirect"

import { routes } from "#app/routes.ts"
import {
	normalizeEmail,
	parseAuthSession,
	type AuthIdentity,
	type AuthSession,
} from "#app/utils/auth-session.ts"
import { db } from "#app/utils/db.ts"

const loginSchema = f.object({
	email: f.field(s.defaulted(s.string(), "")),
	password: f.field(s.defaulted(s.string(), "")),
})

export function loadAuth() {
	return auth({
		schemes: [
			createSessionAuthScheme<AuthIdentity, AuthSession>({
				read(session) {
					return parseAuthSession(session.get("auth"))
				},
				async verify(value) {
					let user = await db.user.findFirst({
						where: { id: value.userId },
						omit: { password: true },
					})

					if (user == null) {
						return null
					}

					return { user }
				},
			}),
		],
	})
}

export const passwordProvider = createCredentialsAuthProvider({
	parse(context) {
		let result = s.parse(loginSchema, context.get(FormData))

		return {
			email: normalizeEmail(result.email),
			password: result.password,
		}
	},
	async verify(input) {
		let user = await db.user.findFirst({ where: { email: input.email } })

		if (user == null) {
			return null
		}

		if (typeof user.password === "string" && user.password !== "") {
			let verified = await bcrypt.compare(input.password, user.password)
			return verified ? user : null
		}

		return null
	},
})

export const requireAuth = requireAuthenticated<AuthIdentity>({
	onFailure() {
		return redirect(routes.auth.login.index.href())
	},
})

export function getPostAuthRedirect(url: URL, fallback = routes.home.index.href()): string {
	return getSafeReturnTo(url.searchParams.get("returnTo")) ?? fallback
}

export function getReturnToQuery(url: URL): { returnTo?: string } {
	let returnTo = getSafeReturnTo(url.searchParams.get("returnTo"))
	return returnTo ? { returnTo } : {}
}

function getSafeReturnTo(returnTo: string | null): string | undefined {
	if (returnTo == null || returnTo === "") {
		return undefined
	}

	let isSafePath = returnTo.startsWith("/") && returnTo.startsWith("//") === false
	return isSafePath ? returnTo : undefined
}
