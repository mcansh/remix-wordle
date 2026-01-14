import { z } from "zod";

let envSchema = z.object({
  SESSION_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse(process.env);
export const WORD_LENGTH = 5;
export const LETTER_INPUTS = [...Array(WORD_LENGTH).keys()];
export const TOTAL_GUESSES = 6;
