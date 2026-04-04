import bcrypt from "bcryptjs"
import { createCredentialsAuthProvider } from "remix/auth"
import {
	auth,
	createSessionAuthScheme,
	requireAuth as requireAuthenticated,
} from "remix/auth-middleware"
import { redirect } from "remix/response/redirect"

import { routes } from "../routes"
import {
	normalizeEmail,
	parseAuthSession,
	type AuthIdentity,
	type AuthSession,
} from "../utils/auth-session.ts"
import { db } from "../utils/db"
import * as f from "../utils/local-form-schema.ts"
import * as s from "../utils/local-schema.ts"

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
					let user = await db.user.findFirst({ where: { id: value.userId } })

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
