import { PrismaPg } from "@prisma/adapter-pg"
import Redis from "ioredis"

import { env } from "./constants"
import { PrismaClient } from "./generated/prisma/client"

let adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
export const db = new PrismaClient({ adapter })

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
})
