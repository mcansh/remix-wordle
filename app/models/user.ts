import bcrypt from "bcryptjs"
import { email, minLength } from "remix/data-schema/checks"
import * as f from "remix/data-schema/form-data"

import type { User } from "../generated/prisma/client"
import { db } from "../utils/db"
import * as s from "../utils/local-schema"

export const joinSchema = f.object({
	email: f.field(s.string().pipe(email())),
	username: f.field(s.string().pipe(minLength(1))),
	password: f.field(s.string().pipe(minLength(10))),
})

export async function getUserByEmail(email: User["email"]) {
	return db.user.findUnique({ where: { email } })
}

export async function createUser(user: {
	username: User["username"]
	email: User["email"]
	password: User["password"]
}) {
	let hashedPassword = await bcrypt.hash(user.password, 10)

	return db.user.create({
		data: {
			username: user.username,
			email: user.email,
			password: hashedPassword,
		},
	})
}

export async function deleteUserByEmail(email: User["email"]) {
	return db.user.delete({ where: { email } })
}

export async function authenticateUser(email: User["email"], password: User["password"]) {
	let user = await db.user.findUnique({
		where: { email },
	})

	if (!user || !user.password) return null

	let isValid = await bcrypt.compare(password, user.password)

	if (!isValid) return null

	let { password: _password, ...userWithoutPassword } = user

	return userWithoutPassword
}

export function createPasswordResetToken(email: string): string | undefined {
	let user = getUserByEmail(email)
	if (!user) return undefined

	let token = Math.random().toString(36).substring(2, 15)
	console.log(`Password reset token for ${email}: ${token}`)
	// resetTokens.set(token, {
	//   userId: user.id,
	//   expiresAt: new Date(Date.now() + 3600000), // 1 hour
	// })

	return token
}

export function resetPassword(token: string, _newPassword: string): boolean {
	// let tokenData = resetTokens.get(token)
	// if (!tokenData || tokenData.expiresAt < new Date()) {
	//   return false
	// }

	console.log(`Resetting password for token ${token}`)

	// let user = getUserById(tokenData.userId)
	// if (!user) return false

	// user.password = newPassword
	// resetTokens.delete(token)
	return true
}
