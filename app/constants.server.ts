import { z } from "zod";

let envSchema = z.object({
  SESSION_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

let env = envSchema.parse(process.env);

export let SESSION_SECRET = env.SESSION_SECRET;
export let DATABASE_URL = env.DATABASE_URL;
export let NODE_ENV = process.env.NODE_ENV;
