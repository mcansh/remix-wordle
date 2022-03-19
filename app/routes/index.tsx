import * as React from "react";
import clsx from "clsx";
import {
  ActionFunction,
  Form,
  json,
  LoaderFunction,
  MetaFunction,
  redirect,
  useActionData,
  useLoaderData,
} from "remix";
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

  if (formData.has("reset")) {
    return redirect("/", {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    });
  }

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

  let guess = letters.join("");

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
  let currentGuessIndex = validGuesses.length;
  let previousGuessIndex = currentGuessIndex - 1;

  if (
    currentGuessIndex === TOTAL_GUESSES &&
    games[currentGuessIndex] &&
    games[currentGuessIndex].every((space) => space.state !== LetterState.Match)
  ) {
    return json<LoaderData>({
      guesses: games,
      currentGuess: currentGuessIndex,
      winner: false,
    });
  }

  if (
    previousGuessIndex >= 0 &&
    games[previousGuessIndex].every(
      (space) => space.state === LetterState.Match
    )
  ) {
    return json<LoaderData>({
      guesses: games,
      currentGuess: currentGuessIndex,
      winner: true,
    });
  }

  return json<LoaderData>(
    { guesses: games, currentGuess: currentGuessIndex },
    { headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
  );
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

        {"winner" in data && (
          <div className="fixed top-1/2 left-1/2 bg-black bg-opacity-70 w-full h-screen -translate-x-1/2 -translate-y-1/2 grid place-items-center">
            <div>
              <div
                className={clsx(
                  "text-center text-2xl",
                  data.winner ? "text-green-500" : "text-red-500"
                )}
              >
                You {data.winner ? "win!" : "lost"} The word was "
                {data.guesses[data.currentGuess - 1]
                  .map((space) => space.letter)
                  .join("")}
                "
              </div>
              <Form reloadDocument method="post">
                <button
                  name="reset"
                  value="true"
                  type="submit"
                  className="text-purple-500 bg-white rounded-md px-4 py-2 text-xl mt-2"
                >
                  Play Again
                </button>
              </Form>
            </div>
          </div>
        )}

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
            className="bg-purple-500 text-white rounded-md px-4 py-2 text-xl mt-2"
          >
            Submit Guess
          </button>
        </div>
      </main>
    </div>
  );
}
