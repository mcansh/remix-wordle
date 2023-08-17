import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

import { singleton } from "./utils/singleton.server";
import { env } from "./constants.server";

export let db = singleton("prisma", () => new PrismaClient());

export let redis = singleton("redis", () => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
});
