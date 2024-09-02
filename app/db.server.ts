import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

import { env } from "./constants.server";

export const db = new PrismaClient();

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
