import type { DataFunctionArgs } from "@remix-run/node";
import { endOfDay, startOfDay } from "date-fns";

import { env } from "~/constants.server";
import { db } from "~/db.server";
import { createGame } from "~/models/game.server";

export async function action({ request }: DataFunctionArgs) {
  let auth = request.headers.get("Authorization");
  if (!auth || auth !== env.WORD_CREATE_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  // check if we already have a game for today
  let existingGame = await db.game.findFirst({
    where: {
      createdAt: {
        gte: startOfDay(new Date()),
        lte: endOfDay(new Date()),
      },
    },
  });

  // if we do, we don't need to create a new one
  if (existingGame) {
    console.log(`Game ${existingGame.id} already exists`);
    return new Response(`Game ${existingGame.id} already exists`, {
      status: 200,
    });
  }

  // otherwise, create a new game
  let game = await createGame();
  console.log(`Created game ${game.id}`);

  return new Response(`Created game ${game.id}`, { status: 201 });
}
