import { getContext } from "remix/async-context-middleware"
import type { AuthState } from "remix/auth-middleware"
import { Auth } from "remix/auth-middleware"

import type { AuthIdentity } from "./auth-session"
export function getCurrentUser(): AuthIdentity {
	let auth = getCurrentAuth()

	if (!auth.ok) {
		throw new Error(
			"Expected an authenticated user. Make sure requireAuth() runs before this code.",
		)
	}

	return auth.identity
}

export function getCurrentUserSafely(): AuthIdentity | null {
	let auth = getCurrentAuth()

	return auth.ok ? auth.identity : null
}

function getCurrentAuth(): AuthState<AuthIdentity> {
	return getContext().get(Auth) as AuthState<AuthIdentity>
}
