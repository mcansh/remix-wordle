import type { Processor } from "bullmq";

import { Queue as BullQueue, Worker } from "bullmq";

import { db, redis } from "./db";
import { isGameComplete } from "./models/game";

type RegisteredQueue = {
  queue: BullQueue;
  worker: Worker;
};

const registeredQueues = new Map<string, RegisteredQueue>();

export function Queue<Payload>(name: string, handler: Processor<Payload>): BullQueue<Payload> {
  const current = registeredQueues.get(name);
  if (current) return current.queue;

  const queue = new BullQueue<Payload>(name, { connection: redis });
  const worker = new Worker<Payload>(name, handler, { connection: redis });

  registeredQueues.set(name, { queue, worker });

  return queue;
}

type QueueData = {
  gameId: string;
};

export const gameQueue = Queue<QueueData>("mark_game_as_complete", async (job) => {
  const game = await db.game.findUnique({
    where: { id: job.data.gameId },
  });

  if (!game) {
    console.log(`Game ${job.data.gameId} not found`);
    return;
  }

  if (!isGameComplete(game.status)) {
    console.log(`Game ${job.data.gameId} not complete, marking as complete`);

    await db.game.update({
      where: { id: job.data.gameId },
      data: { status: "COMPLETE" },
    });

    console.log(`Game ${job.data.gameId} marked as complete`);
  }
});
