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
import clsx from "clsx";
import { requireUserId } from "~/session.server";
import { createGuess, getFullBoard, getTodaysGame } from "~/models/game.server";
import { GameOverModal } from "~/components/game-over-modal";
import { LetterState } from "~/utils";
import { LETTER_INPUTS, TOTAL_GUESSES, WORD_LENGTH } from "~/constants";

export let meta: MetaFunction = () => {
  return { title: "Remix Wordle" };
};

export let loader = async ({ request }: LoaderArgs) => {
  let userId = await requireUserId(request);
  let game = await getTodaysGame(userId);
  let board = getFullBoard(game);

  let url = new URL(request.url);
  if (!url.searchParams.has("cheat")) {
    let { word, ...rest } = board.game;
    return json({
      ...rest,
      currentGuess: board.currentGuess,
    });
  }

  return json({
    currentGuess: board.currentGuess,
    ...board.game,
  });
};

export let action = async ({ request }: ActionArgs) => {
  let userId = await requireUserId(request);
  let formData = await request.formData();
  let letters = formData.getAll("letter");

  let guessedWord = letters.join("");
  let [_guess, error] = await createGuess(userId, guessedWord);

  if (error) {
    return json({ error }, { status: 400 });
  }

  let url = new URL(request.url);

  return redirect(url.pathname + url.search);
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
        {data.status === "IN_PROGRESS" && "word" in data ? (
          <h2 className="text-sm text-center mb-4 text-gray-700">
            {/* @ts-ignore */}
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
          <GameOverModal
            currentGuess={data.currentGuess}
            guesses={data.guesses}
            totalGuesses={TOTAL_GUESSES}
            winner={data.status === "WON"}
            // @ts-ignore
            word={data.word}
          />
        ) : null}

        <div className="space-y-4">
          {data.guesses.map((guess, guessIndex) => {
            if (data.currentGuess === guessIndex) {
              return (
                <Form
                  reloadDocument
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
