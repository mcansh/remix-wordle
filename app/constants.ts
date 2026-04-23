import { minLength } from "remix/data-schema/checks"

import * as s from "./utils/local-schema.ts"

const envSchema = s.object({
	SESSION_SECRET: s.string().pipe(minLength(1)),
	DATABASE_URL: s.string().pipe(minLength(1)),
	REDIS_URL: s.string().pipe(minLength(1)),
	NODE_ENV: s.enum_(["development", "production", "test"]),
})

export const env = s.parse(envSchema, process.env)
export const WORD_LENGTH = 5
export const LETTER_INPUTS = [...Array(WORD_LENGTH).keys()]
export const TOTAL_GUESSES = 6
export const REVEAL_WORD = "cheat"
export const CHEAT_SESSION_KEY = "wordle-cheat-enabled"
