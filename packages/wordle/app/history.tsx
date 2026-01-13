import type { Controller } from "@remix-run/fetch-router";

import clsx from "clsx";

import { Document } from "./components/document.tsx";
import { GameOverModal } from "./components/game-over-modal.tsx";
import { TOTAL_GUESSES } from "./constants.ts";
import { db } from "./db.ts";
import { requireAuth } from "./middleware/auth.ts";
import { getGameById, isGameComplete } from "./models/game.ts";
import { routes } from "./routes.ts";
import { getCurrentUser } from "./utils/context.ts";
import { LetterState } from "./utils/game.ts";
import { render } from "./utils/render.ts";

export default {
  middleware: [requireAuth()],
  actions: {
    async index() {
      const user = getCurrentUser();

      const games = await db.game.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { guesses: true } },
          status: true,
          word: true,
        },
      });

      const formatter = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "short",
      });

      let formattedGames = games.map((game) => {
        const createdAt = new Date(game.createdAt);
        const updatedAt = new Date(game.updatedAt);
        const date = updatedAt > createdAt ? updatedAt : createdAt;
        return {
          id: game.id,
          date: formatter.format(date),
          guesses: game._count.guesses,
          status: game.status,
          word: game.word,
        };
      });

      return render(
        <Document>
          <div className="mx-auto h-full max-w-sm">
            <div className="">
              <div className="sm:flex-auto">
                <h1 className="">History</h1>
                <p className="">A history of all of your games.</p>
              </div>
            </div>
            <div className="">
              <div className="">
                <div className="">
                  <table className="">
                    <thead>
                      <tr>
                        <th scope="col" className="">
                          Date
                        </th>
                        <th scope="col" className="">
                          Word
                        </th>
                        <th scope="col" className="">
                          Guesses
                        </th>
                        <th scope="col" className="">
                          Status
                        </th>
                        <th scope="col" className="">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formattedGames.map((game, gameIndex, array) => (
                        <tr key={game.id}>
                          <td
                            className={clsx(
                              gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                              "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8",
                            )}
                          >
                            {game.date}
                          </td>
                          <td
                            className={clsx(
                              gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                              "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                            )}
                          >
                            {game.word}
                          </td>
                          <td
                            className={clsx(
                              gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                              "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                            )}
                          >
                            {game.guesses}
                          </td>
                          <td
                            className={clsx(
                              gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                              "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                            )}
                          >
                            {game.status}
                          </td>
                          <td
                            className={clsx(
                              gameIndex !== array.length - 1 ? "border-b border-gray-200" : "",
                              "relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-8 lg:pr-8",
                            )}
                          >
                            <a href={routes.history.game.href({ gameid: game.id })} className="">
                              View<span className="sr-only">, {game.word}</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Document>,
      );
    },

    async game({ params }) {
      const game = await getGameById(params.gameid);

      if (!game) {
        return render(
          <Document>
            <div className="mx-auto h-full max-w-sm">
              <header>
                <h1 className="">Remix Wordle</h1>
              </header>

              <main>
                <div className="">
                  <h2 className="">Game Not Found</h2>
                  <p className="">The game you are looking for does not exist.</p>
                </div>
              </main>
            </div>
          </Document>,
          { status: 404 },
        );
      }

      const showModal = isGameComplete(game.status);

      return render(
        <Document>
          {showModal ? (
            <GameOverModal
              currentGuess={game.currentGuess}
              guesses={game.guesses}
              totalGuesses={TOTAL_GUESSES}
              winner={game.status === "WON"}
              word={"word" in game ? game.word : ""}
            />
          ) : null}

          <div className="mx-auto h-full max-w-sm">
            <header>
              <h1 className="">Remix Wordle</h1>
            </header>

            <main>
              <div className="space-y-4">
                {game.guesses.map((guess, guessIndex) => {
                  return (
                    <div key={`guess-number-${guessIndex}`} className="grid grid-cols-5 gap-4">
                      {guess.letters.map((letter) => {
                        return (
                          <input
                            key={`guess-${guessIndex}-letter-${letter.id}`}
                            readOnly
                            className={clsx(
                              "inline-block aspect-square w-full border-4 text-center text-xl uppercase",
                              {
                                "border-green-500 bg-green-500 text-white":
                                  letter.state === LetterState.Match,
                                "border-red-500 bg-red-500 text-white":
                                  letter.state === LetterState.Miss,
                                "border-yellow-500 bg-yellow-500 text-white":
                                  letter.state === LetterState.Present,
                                "border-gray-400 text-white": letter.state === LetterState.Blank,
                              },
                            )}
                            value={letter.letter}
                            type="text"
                            pattern="[a-zA-Z]{1}"
                            maxLength={1}
                            name="letter"
                            aria-label={`letter ${guessIndex + 1}`}
                          />
                        );
                      })}
                    </div>
                  );
                })}

                <input
                  form="current-guess"
                  enterKeyHint="send"
                  type="submit"
                  className=""
                  value="Submit Guess"
                />
              </div>
            </main>
          </div>
        </Document>,
      );
    },
  },
} satisfies Controller<typeof routes.history>;
