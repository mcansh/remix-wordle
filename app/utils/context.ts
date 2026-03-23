import { getContext } from "remix/async-context-middleware"
import { createContextKey } from "remix/fetch-router"

import type { User } from "../generated/prisma/client"

let USER_KEY = createContextKey<User>()
let NONCE_KEY = createContextKey<string>()

export function getCurrentUser(): User {
	return getContext().get(USER_KEY)
}

export function getCurrentUserSafely(): User | null {
	try {
		return getCurrentUser()
	} catch {
		return null
	}
}

export function setCurrentUser(user: User): void {
	getContext().set(USER_KEY, user)
}

/**
 * Get the current CSP nonce from app storage.
 */
export function getCSPNonce(): string {
	return getContext().get(NONCE_KEY)
}

/**
 * Set the current CSP nonce in app storage.
 */
export function setCSPNonce(nonce: string): void {
	getContext().set(NONCE_KEY, nonce)
}
