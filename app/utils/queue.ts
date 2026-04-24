import type { ConnectionOptions, Job } from "bullmq"
import { Queue, QueueEvents, Worker } from "bullmq"
import { startOfDay } from "date-fns"

import { env } from "../env.ts"
import { db } from "./db.ts"
const connection = { url: env.REDIS_URL } satisfies ConnectionOptions

let queue: Queue | null = null
let worker: Worker | null = null
let queueEvents: QueueEvents | null = null

export async function startQueue(): Promise<void> {
	if (queue) return

	queue = new Queue("game-cleanup", {
		connection,
		defaultJobOptions: {
			attempts: 3,
			backoff: {
				type: "exponential",
				delay: 1000,
			},
			removeOnComplete: true,
			removeOnFail: false,
		},
	})

	await queue.upsertJobScheduler("midnight-cleanup", {
		pattern: "0 0 0 * * *",
	})

	queueEvents = new QueueEvents("game-cleanup", { connection })

	worker = new Worker(
		"game-cleanup",
		async (job) => {
			console.log(`Starting job ${job.id} at ${new Date().toISOString()}`)

			await cleanupIncompleteGames(job.id)
		},
		{
			connection,
			concurrency: 5,
		},
	)

	worker.on("completed", (job) => {
		console.log(`Job ${job.id} completed`)
	})

	worker.on("failed", (job, err) => {
		console.error(`Job ${job?.id} failed: ${err.message}`)
	})
}

export async function stopQueue(): Promise<void> {
	await worker?.close()
	await queue?.close()
	await queueEvents?.close()

	queue = null
	worker = null
	queueEvents = null
}

export async function enqueueCleanup(date?: Date): Promise<Job> {
	if (!queue) throw new Error("Queue not initialized")

	let delay = date ? date.getTime() - Date.now() : 0

	return queue.add("cleanup", {}, { delay: Math.max(0, delay) })
}

async function cleanupIncompleteGames(jobId?: string): Promise<void> {
	let games = await db.game.findMany({
		where: {
			status: { in: ["IN_PROGRESS", "EMPTY"] },
			createdAt: { lt: startOfDay(new Date()) },
		},
	})

	if (games.length === 0) {
		console.log(`Job ${jobId}: No games to clean up`)
		return
	}

	await db.game.updateMany({
		where: {
			id: { in: games.map((g) => g.id) },
			status: { in: ["IN_PROGRESS", "EMPTY"] },
		},
		data: { status: "COMPLETE" },
	})

	console.log(`Job ${jobId}: Marked ${games.length} games as COMPLETE`)
}
