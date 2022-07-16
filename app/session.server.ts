import invariant from "tiny-invariant";
import { createCookieSessionStorage } from "@remix-run/node";
import { ComputedGuess, getRandomWord } from "./utils";

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

export async function getSession(request: Request, gameId: string) {
  let cookie = request.headers.get("Cookie");
  let session = await sessionStorage.getSession(cookie);
  let game = await session.get(gameId);

  if (!game) {
    game = { word: getRandomWord(), guesses: [], done: false };
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
