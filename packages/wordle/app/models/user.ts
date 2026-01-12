import bcrypt from "bcryptjs";
import { z } from "zod";

import type { User } from "../generated/prisma/client";

import { db } from "../db";

export const joinSchema = z.object({
  email: z.email(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export type JoinData = z.infer<typeof joinSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export async function getUserById(id: User["id"]) {
  return db.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return db.user.findUnique({ where: { email } });
}

export async function createUser(user: {
  username: User["username"];
  email: User["email"];
  password: User["password"];
}) {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return db.user.create({
    data: {
      username: user.username,
      email: user.email,
      password: hashedPassword,
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return db.user.delete({ where: { email } });
}

export async function authenticateUser(email: User["email"], password: User["password"]) {
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) return null;

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) return null;

  const { password: _password, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

export function createPasswordResetToken(email: string): string | undefined {
  let user = getUserByEmail(email);
  if (!user) return undefined;

  let token = Math.random().toString(36).substring(2, 15);
  console.log(`Password reset token for ${email}: ${token}`);
  // resetTokens.set(token, {
  //   userId: user.id,
  //   expiresAt: new Date(Date.now() + 3600000), // 1 hour
  // })

  return token;
}

export function resetPassword(token: string, newPassword: string): boolean {
  // let tokenData = resetTokens.get(token)
  // if (!tokenData || tokenData.expiresAt < new Date()) {
  //   return false
  // }

  console.log(`Resetting password for token ${token}`);

  // let user = getUserById(tokenData.userId)
  // if (!user) return false

  // user.password = newPassword
  // resetTokens.delete(token)
  return true;
}
