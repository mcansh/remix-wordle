import { z } from "zod";

let envSchema = z.object({
  SESSION_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  NODE_ENV: z.enum(["development", "production"]),
  WORD_CREATE_TOKEN: z.string().min(1),
});

export let env = envSchema.parse(process.env);
