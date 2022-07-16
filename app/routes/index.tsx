import * as React from "react";
import clsx from "clsx";
import {
  ActionFunction,
  json,
  LoaderFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { getSession, sessionStorage } from "~/session.server";
import {
  ComputedGuess,
  computeGuess,
  createEmptyGuess,
  getRandomWord,
  isValidGuess,
  isValidWord,
  LetterState,
} from "~/utils";
import checkIconUrl from "~/icons/check.svg";
import xIconUrl from "~/icons/x.svg";

let WORD_LENGTH = 5;
let TOTAL_GUESSES = 6;

export let meta: MetaFunction = () => {
  return { title: "Remix Wordle" };
};

interface ActionData {
  error?: string;
}

export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData();
  let session = await getSession(request);

  let word = session.get("word");

  if (!word) {
    return json<ActionData>(
      { error: "No word has been set." },
      { status: 500 }
    );
  }

  let letters = formData.getAll("letter");

  if (
    letters.length !== WORD_LENGTH ||
    letters.some((letter) => letter === "")
  ) {
    return json<ActionData>(
      { error: "You must guess a word of length " + WORD_LENGTH },
      { status: 400 }
    );
  }

  if (!letters.every((letter) => typeof letter === "string")) {
    return json<ActionData>(
      { error: "You must guess a word of length " + WORD_LENGTH },
      { status: 400 }
    );
  }

  let guess = letters.join("").toLowerCase();

  if (!isValidWord(guess)) {
    return json<ActionData>(
      { error: `${guess} is not a valid word` },
      { status: 400 }
    );
  }

  let computed = computeGuess(guess, word);

  let guesses = (session.get("guesses") || []) as Array<Array<ComputedGuess>>;

  guesses.push(computed);

  session.set("guesses", guesses);

  return redirect("/", {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
};

interface LoaderData {
  guesses: Array<Array<ComputedGuess>>;
  currentGuess: number;
  winner?: boolean;
  done: boolean;
}

export let loader: LoaderFunction = async ({ request }) => {
  let session = await getSession(request);

  if (!session.has("word")) {
    let word = getRandomWord();
    session.set("word", word);
  }

  let guesses = session.get("guesses") || [];
  let validGuesses = guesses.filter(isValidGuess);
  let fakeGamesToMake = TOTAL_GUESSES - validGuesses.length;
  let fakeGames: Array<Array<ComputedGuess>> = Array.from({
    length: fakeGamesToMake,
  }).map(() => {
    return Array.from({ length: WORD_LENGTH }).map(createEmptyGuess);
  });
  let games: Array<Array<ComputedGuess>> = [...validGuesses, ...fakeGames];
  let currentGuess = validGuesses.length;
  let currentGuessLetters = games.at(currentGuess - 1);

  if (!currentGuessLetters) {
    throw new Response("No current guess???", { status: 422 });
  }

  if (currentGuessLetters.every((space) => space.state === LetterState.Match)) {
    return json<LoaderData>({
      guesses: games,
      currentGuess,
      winner: true,
      done: true,
    });
  }

  if (TOTAL_GUESSES > currentGuess) {
    return json<LoaderData>(
      {
        guesses: games,
        currentGuess,
        done: false,
      },
      { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
    );
  }

  return json<LoaderData>({
    guesses: games,
    currentGuess,
    winner: false,
    done: true,
  });
};

let inputs = [...Array(WORD_LENGTH).keys()];

export default function IndexPage() {
  let data = useLoaderData<LoaderData>();
  let actionData = useActionData<ActionData>();

  return (
    <div className="max-w-sm mx-auto">
      <header>
        <h1 className="text-4xl font-semibold text-center py-4">
          Remix Wordle
        </h1>
      </header>

      <main>
        {actionData?.error && (
          <div className="text-red-500 text-center mb-4">
            {actionData.error}
          </div>
        )}

        {data.done ? (
          <div className="relative z-10" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
                <div className="relative bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-sm sm:w-full sm:p-6">
                  <div>
                    <div
                      className={clsx(
                        "mx-auto flex items-center justify-center h-12 w-12 rounded-full",
                        data.winner ? "bg-green-100" : "bg-red-100"
                      )}
                    >
                      <svg
                        aria-hidden="true"
                        className={clsx(
                          "h-6 w-6",
                          data.winner ? "text-green-600" : "text-red-600"
                        )}
                      >
                        <use
                          href={
                            data.winner
                              ? `${checkIconUrl}#check`
                              : `${xIconUrl}#x`
                          }
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        You {data.winner ? "won" : "lost"}!
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Come back and try again tomorrow
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {data.guesses.map((guess, guessIndex) => {
            if (data.currentGuess === guessIndex) {
              return (
                <Form
                  key={`current-guess-${data.currentGuess}`}
                  replace
                  method="post"
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
                  {inputs.map((index) => (
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
                {guess.map((letter) => {
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

          <button
            form="current-guess"
            enterKeyHint="enter"
            type="submit"
            disabled={"winner" in data || data.currentGuess === TOTAL_GUESSES}
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            Submit Guess
          </button>
        </div>
      </main>
    </div>
  );
}
