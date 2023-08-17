import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { ClientOnly } from "remix-utils";

import { requireUserId } from "~/session.server";
import {
  createGuess,
  getFullBoard,
  getTodaysGameForUser,
  isGameComplete,
} from "~/models/game.server";
import { GameOverModal } from "~/components/game-over-modal";
import { LetterState } from "~/utils/game";
import { LETTER_INPUTS, TOTAL_GUESSES } from "~/constants";

export let meta: V2_MetaFunction = () => {
  return [{ title: "Remix Wordle" }];
};

export let loader = async ({ request }: LoaderArgs) => {
  let userId = await requireUserId(request);
  let game = await getTodaysGameForUser(userId);
  let board = getFullBoard(game);

  let url = new URL(request.url);

  let showModal = isGameComplete(game.status);

  if (url.searchParams.has("cheat") || showModal) {
    return json({ ...board, showModal });
  }

  let { word, ...rest } = board;

  return json({ ...rest, word: undefined, showModal });
};

export let action = async ({ request }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let letters = formData.getAll("letter");
  let has_js = formData.get("has_js");
  let url = new URL(request.url);

  let guessedWord = letters.join("");
  let error = await createGuess(userId, guessedWord);

  if (error) {
    return json({ error }, { status: 422, statusText: "Unprocessable Entity" });
  }

  if (!has_js) {
    return redirect(url.pathname + url.search);
  }

  let game = await getTodaysGameForUser(userId);
  let board = getFullBoard(game);

  let showModal = isGameComplete(game.status);

  if (url.searchParams.has("cheat") || showModal) {
    return json({
      ...board,
      showModal,
    });
  }

  let { word, ...rest } = board;

  return json({ ...rest, word: undefined, showModal });
};

export default function IndexPage() {
  let data = useLoaderData<typeof loader>();
  let fetcher = useFetcher<typeof action>();

  let errorMessage =
    fetcher.data && "error" in fetcher.data && fetcher.data.error
      ? fetcher.data.error
      : null;

  return (
    <>
      {data.showModal ? (
        <GameOverModal
          currentGuess={data.currentGuess}
          guesses={data.guesses}
          totalGuesses={TOTAL_GUESSES}
          winner={data.status === "WON"}
          word={"word" in data ? data.word.word : ""}
        />
      ) : null}

      <div
        className="mx-auto h-full max-w-sm"
        aria-hidden={data.showModal ? true : undefined}
      >
        <header>
          <h1 className="py-4 text-center text-4xl font-semibold">
            Remix Wordle
          </h1>
          {!data.showModal && "word" in data ? (
            <h2 className="mb-4 text-center text-sm text-gray-700">
              Your word is {data.word.word}
            </h2>
          ) : null}
        </header>

        <main>
          {errorMessage && (
            <div className="mb-4 text-center text-red-500">{errorMessage}</div>
          )}

          <div className="space-y-4">
            {data.guesses.map((guess, guessIndex) => {
              if (data.currentGuess === guessIndex) {
                return (
                  <fetcher.Form
                    method="post"
                    key={`current-guess-${data.currentGuess}`}
                    replace
                    className="grid grid-cols-5 gap-4"
                    id="current-guess"
                    autoComplete="off"
                    onChange={(event) => {
                      let target = event.nativeEvent.target;
                      if (target instanceof HTMLInputElement) {
                        if (target.value === "") return;
                        if (target.nextElementSibling) {
                          let nextInput = target.nextElementSibling;
                          if (nextInput instanceof HTMLInputElement) {
                            nextInput.select();
                          }
                        }
                      }
                    }}
                  >
                    {LETTER_INPUTS.map((index) => (
                      <input
                        key={`input-number-${index}`}
                        className={clsx(
                          "inline-block aspect-square w-full border-4 text-center text-xl uppercase",
                          errorMessage
                            ? "border-red-500"
                            : "border-gray-900 empty:border-gray-400",
                        )}
                        type="text"
                        pattern="[a-zA-Z]{1}"
                        maxLength={1}
                        name="letter"
                        aria-label={`letter ${index + 1}`}
                        placeholder=" "
                        onClick={(event) => event.currentTarget.select()}
                        autoFocus={index === 0}
                      />
                    ))}
                    <ClientOnly>
                      {() => <input type="hidden" name="has_js" value="true" />}
                    </ClientOnly>
                  </fetcher.Form>
                );
              }

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
