import type { ConnectionOptions } from "bullmq"
import { Queue, Worker } from "bullmq"
import { startOfDay } from "date-fns"

import { env } from "#app/constants.ts"

import { db } from "./db.ts"

const connection = { url: env.REDIS_URL } satisfies ConnectionOptions

const queue = new Queue("my-cron-jobs", { connection })

await queue.upsertJobScheduler(
	"midnight-game-cleanup",
	{
		pattern: "0 0 0 * * *", // Every day at midnight
	},
	{ name: "cron-job" },
)

// Worker to process the jobs
const worker = new Worker(
	"my-cron-jobs",
	async (job) => {
		console.log(`Starting job ${job.id} at ${new Date().toISOString()} to clean up games`)

		let incompleteGames = await db.game.findMany({
			where: {
				status: { in: ["IN_PROGRESS", "EMPTY"] },
				createdAt: {
					lt: startOfDay(new Date()), // games created before today
				},
			},
		})

		for (let game of incompleteGames) {
			await db.game.update({
				where: { id: game.id },
				data: { status: "COMPLETE" },
			})

			console.log(`Marked game ${game.id} as COMPLETE`)
		}
	},
	{ connection },
)

worker.on("completed", (job) => {
	console.log(`Job ${job.id} has completed`)
})

worker.on("failed", (job, err) => {
	console.error(`Job ${job?.id} has failed with error: ${err.message}`)
})
