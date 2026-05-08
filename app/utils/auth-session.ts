import { Result, TaggedError } from "better-result"
import * as s from "remix/data-schema"

import type { User } from "#app/generated/prisma/client.ts"

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

class InvalidAuthSessionError extends TaggedError("InvalidAuthSessionError")<{
	message: string
}>() {}

export type ParseAuthSessionError = InvalidAuthSessionError

export function parseAuthSession(value: unknown): Result<AuthSession, ParseAuthSessionError> {
	let result = s.parseSafe(authSessionSchema, value)

	if (result.success === false) {
		return Result.err(new InvalidAuthSessionError({ message: "Invalid auth session" }))
	}

	let authSession = {
		userId: result.value.userId,
	} satisfies AuthSession

	return Result.ok(authSession)
}
