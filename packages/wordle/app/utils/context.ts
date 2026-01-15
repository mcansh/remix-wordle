import { getContext } from "@remix-run/async-context-middleware"
import { createStorageKey } from "@remix-run/fetch-router"

import type { User } from "../generated/prisma/client"

let USER_KEY = createStorageKey<User>()

export function getCurrentUser(): User {
	return getContext().storage.get(USER_KEY)
}

export function getCurrentUserSafely(): User | null {
	try {
		return getCurrentUser()
	} catch {
		return null
	}
}

export function setCurrentUser(user: User): void {
	getContext().storage.set(USER_KEY, user)
}
