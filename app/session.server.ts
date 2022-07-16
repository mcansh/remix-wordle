import invariant from "tiny-invariant";
import { createCookieSessionStorage } from "@remix-run/node";
import { ComputedGuess, getRandomWord } from "./utils";
import { format, startOfDay } from "date-fns";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "strict",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export interface Game {
  word: string;
  guesses: Array<Array<ComputedGuess>>;
}

export async function getSession(request: Request) {
  let cookie = request.headers.get("Cookie");
  let session = await sessionStorage.getSession(cookie);

  let gameId = format(startOfDay(new Date()), "yyyy-MM-dd");
  let game = await session.get(gameId);

  if (!game) {
    game = { word: getRandomWord(), guesses: [], done: false };
    session.set(gameId, game);
  }

  return {
    getSession: () => session,
    getGame: async (): Promise<Game> => {
      return game;
    },
    setGame: async (guesses: Game["guesses"]) => {
      session.set(gameId, { ...game, guesses });
    },
  };
}
