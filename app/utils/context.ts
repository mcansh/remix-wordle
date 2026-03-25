import { getContext } from "remix/async-context-middleware"
import { createContextKey } from "remix/fetch-router"

import type { User } from "../generated/prisma/client"

let USER_KEY = createContextKey<User>()

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
