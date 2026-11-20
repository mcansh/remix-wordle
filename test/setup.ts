import { loadEnvFile } from "node:process"

try {
	loadEnvFile(".env")
} catch {}

process.env.SESSION_SECRET ??= "thisisaverysecuresecret1234567890"
process.env.DATABASE_URL ??= "postgresql://postgres:password@localhost:5432/remix_wordle_test"
process.env.REDIS_URL ??= "redis://localhost:6379"
process.env.NODE_ENV ??= "test"

export function globalSetup() {}
