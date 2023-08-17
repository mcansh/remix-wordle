import { json } from "@remix-run/node";
import type { V2_MetaFunction, DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";

import { GameOverModal } from "~/components/game-over-modal";
import { TOTAL_GUESSES } from "~/constants";
import { getGameById } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { LetterState } from "~/utils/game";

export async function loader({ request, params }: DataFunctionArgs) {
  await requireUserId(request);
  let gameId = params.gameid;
  if (!gameId) {
    throw new Response("Not found", { status: 404 });
  }

  let game = await getGameById(gameId);

  return json({
    game: {
      ...game,
      status: ["COMPLETE", "WON"].includes(game.status)
        ? game.status
        : "COMPLETE",
    },
  });
}

export let meta: V2_MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Remix Wordle" }];
  }

  return [
    {
      title: `Remix Wordle - ${data.game.status} - ${data.game.word}`,
    },
  ];
};

export default function HistoricalGamePage() {
  let data = useLoaderData<typeof loader>();
  let showModal = ["COMPLETE", "WON"].includes(data.game.status);

  return (
    <>
      {showModal ? (
        <GameOverModal
          currentGuess={data.game.currentGuess}
          guesses={data.game.guesses}
          totalGuesses={TOTAL_GUESSES}
          winner={data.game.status === "WON"}
          word={"word" in data.game ? data.game.word : ""}
        />
      ) : null}

      <div className="mx-auto h-full max-w-sm">
        <header>
          <h1 className="py-4 text-center text-4xl font-semibold">
            Remix Wordle
          </h1>
        </header>

        <main>
          <div className="space-y-4">
            {data.game.guesses.map((guess, guessIndex) => {
              return (
                <div
                  key={`guess-number-${guessIndex}`}
                  className="grid grid-cols-5 gap-4"
                >
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
                            "border-gray-400 text-white":
                              letter.state === LetterState.Blank,
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
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
              value="Submit Guess"
            />
          </div>
        </main>
      </div>
    </>
  );
}
