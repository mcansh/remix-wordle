import type { User } from "../generated/prisma/client.ts"
import * as s from "../utils/local-schema.ts"

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase()
}

export interface AuthSession {
	userId: string
}

export interface AuthIdentity {
	user: Omit<User, "password">
}

const authSessionSchema = s.object({
	userId: s.string(),
})

export function parseAuthSession(value: unknown): AuthSession | null {
	let result = s.parseSafe(authSessionSchema, value)

	if (result.success === false) {
		return null
	}

	let authSession = {
		userId: result.value.userId,
	} satisfies AuthSession

	return authSession
}
