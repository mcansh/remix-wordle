import {
  ActionArgs,
  json,
  LoaderArgs,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { Letter, LetterState } from "@prisma/client";
import clsx from "clsx";

import checkIconUrl from "~/icons/check.svg";
import xIconUrl from "~/icons/x.svg";
import { boardToEmoji } from "~/utils/board-to-emoji";
import { requireUserId } from "~/session.server";
import { createGuess, getTodaysGame } from "~/models/game.server";

export let WORD_LENGTH = 5;
export let LETTER_INPUTS = [...Array(WORD_LENGTH).keys()];
export let TOTAL_GUESSES = 6;

export let meta: MetaFunction = () => {
  return { title: "Remix Wordle" };
};

export let loader = async ({ request }: LoaderArgs) => {
  let userId = await requireUserId(request);
  let game = await getTodaysGame(userId);

  let fillerGuessesToMake = TOTAL_GUESSES - game.guesses.length;
  let fillerGuesses: Array<{ letters: Array<Letter> }> = Array.from({
    length: fillerGuessesToMake,
  }).map(() => {
    return {
      letters: Array.from({ length: WORD_LENGTH }).map((): Letter => {
        return {
          id: "",
          updatedAt: new Date(),
          createdAt: new Date(),
          state: LetterState.Blank,
          letter: "",
          guessId: "",
        };
      }),
    };
  });
  let guesses = [...game.guesses, ...fillerGuesses];
  let currentGuess = game.guesses.length;

  let url = new URL(request.url);
  if (!url.searchParams.has("cheat")) {
    let { word, ...rest } = game;
    return json({
      ...rest,
      guesses,
      currentGuess,
    });
  }

  return json({
    ...game,
    guesses,
    currentGuess,
  });
};

export let action = async ({ request }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let letters = formData.getAll("letter");

  if (!letters.every((letter) => typeof letter === "string")) {
    return json(
      { error: "You must guess a word of length " + WORD_LENGTH },
      { status: 400 }
    );
  }

  if (
    letters.length !== WORD_LENGTH ||
    letters.some((letter) => letter === "")
  ) {
    return json(
      { error: "You must guess a word of length " + WORD_LENGTH },
      { status: 400 }
    );
  }

  let guess = await createGuess(userId, letters.join(""));

  console.log({ guess });

  return redirect("/");
};

export default function IndexPage() {
  let data = useLoaderData<typeof loader>();
  let actionData = useActionData<typeof action>();
  let location = useLocation();
  let actionUrl =
    location.pathname +
    (location.search.length > 0 ? location.search + "&index" : "?index");

  return (
    <div className="max-w-sm mx-auto">
      <header>
        <h1 className="text-4xl font-semibold text-center py-4">
          Remix Wordle
        </h1>
        {data.status === "IN_PROGRESS" && data.word ? (
          <h2 className="text-sm text-center mb-4 text-gray-700">
            Your word is {data.word}
          </h2>
        ) : null}
      </header>

      <main>
        {actionData?.error && (
          <div className="text-red-500 text-center mb-4">
            {actionData.error}
          </div>
        )}

        {data.status === "COMPLETE" || data.status === "WON" ? (
          <GameCompleteModal />
        ) : null}

        <div className="space-y-4">
          {data.guesses.map((guess, guessIndex) => {
            if (data.currentGuess === guessIndex) {
              return (
                <Form
                  method="post"
                  action={actionUrl}
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
                        "border-4 text-center uppercase w-full aspect-square inline-block text-xl",
                        actionData?.error
                          ? "border-red-500"
                          : "empty:border-gray-400 border-gray-900"
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
                </Form>
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
                        "border-4 text-center uppercase w-full aspect-square inline-block text-xl",
                        {
                          "bg-green-500 border-green-500 text-white":
                            letter.state === LetterState.Match,
                          "bg-red-500 border-red-500 text-white":
                            letter.state === LetterState.Miss,
                          "bg-yellow-500 border-yellow-500 text-white":
                            letter.state === LetterState.Present,
                          "border-gray-400 text-white":
                            letter.state === LetterState.Blank,
                        }
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
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            value="Submit Guess"
          />
        </div>
      </main>
    </div>
  );
}

function GameCompleteModal() {
  let data = useLoaderData<typeof loader>();
  let winner = data.status === "WON";
  let emojiBoard = boardToEmoji(data.guesses);
  let attempts = winner ? data.currentGuess : "X";

  return (
    <div className="relative z-10" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
            <div>
              <div
                className={clsx(
                  "mx-auto flex items-center justify-center h-12 w-12 rounded-full",
                  winner ? "bg-green-100" : "bg-red-100"
                )}
              >
                <svg
                  aria-hidden="true"
                  className={clsx(
                    "h-6 w-6",
                    winner ? "text-green-600" : "text-red-600"
                  )}
                >
                  <use
                    href={winner ? `${checkIconUrl}#check` : `${xIconUrl}#x`}
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Game Summary
                </h3>
                <div className="mt-2">
                  <div className="whitespace-pre">{emojiBoard}</div>
                  <button
                    type="button"
                    onClick={async () => {
                      let text = `
                        Remix Wordle - ${attempts}/${TOTAL_GUESSES}
                        ${emojiBoard}
                      `
                        .split("\n")
                        .map((line) => line.trim())
                        .join("\n");

                      try {
                        const type = "text/plain";
                        const blob = new Blob([text], { type });
                        let write = [new ClipboardItem({ [type]: blob })];
                        await window.navigator.clipboard.write(write);
                      } catch (error) {
                        // browser doesn't support clipboard api
                      }
                    }}
                  >
                    Copy to clipboard 📋
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    The word was <strong>{data.word}</strong>. Come back and try
                    again tomorrow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
