import { json, redirect, unstable_defineAction, unstable_defineLoader } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { ClientOnly } from "remix-utils/client-only";

import { GameOverModal } from "~/components/game-over-modal";
import { LETTER_INPUTS, TOTAL_GUESSES } from "~/constants";
import { createGuess, getFullBoard, getTodaysGame, isGameComplete } from "~/models/game.server";
import { requireUserId } from "~/session.server";
import { LetterState } from "~/utils/game";

export const meta = () => {
  return [{ title: "Remix Wordle" }];
};

export const loader = unstable_defineLoader(async ({ request }) => {
  const userId = await requireUserId(request);
  const game = await getTodaysGame(userId);
  const board = getFullBoard(game);

  const url = new URL(request.url);

  const showModal = isGameComplete(game.status);

  const { word, ...rest } = board;

  return json({
    ...rest,
    word: showModal || url.searchParams.has("cheat") ? word : undefined,
    showModal,
    keyboardWithStatus: board.keyboardWithStatus,
  });
});

export const action = unstable_defineAction(async ({ request }) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const letters = formData.getAll("letter");
  const has_js = formData.get("has_js");
  const url = new URL(request.url);

  const guessedWord = letters.join("");
  const error = await createGuess(userId, guessedWord);

  if (error) {
    return json({ error }, { status: 422, statusText: "Unprocessable Entity" });
  }

  if (!has_js) {
    return redirect(url.pathname + url.search);
  }

  const game = await getTodaysGame(userId);
  const board = getFullBoard(game);

  const showModal = isGameComplete(game.status);

  const { word, ...rest } = board;

  return json({
    ...rest,
    word: showModal || url.searchParams.has("cheat") ? word : undefined,
    showModal,
    keyboardWithStatus: board.keyboardWithStatus,
  });
});

export default function IndexPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const errorMessage =
    fetcher.data && "error" in fetcher.data && fetcher.data.error ? fetcher.data.error : null;

  return (
    <>
      {data.showModal ? (
        <GameOverModal
          currentGuess={data.currentGuess}
          guesses={data.guesses}
          totalGuesses={TOTAL_GUESSES}
          winner={data.status === "WON"}
          word={data.word || ""}
        />
      ) : null}

      <div className="h-full" aria-hidden={data.showModal ? true : undefined}>
        <header>
          <h1 className="">Remix Wordle</h1>
          {!data.showModal && data.word ? <h2 className="">Your word is {data.word}</h2> : null}
        </header>

        <main>
          {errorMessage && <div className="">{errorMessage}</div>}
          <div className="">
            {data.guesses.map((guess, guessIndex) => {
              if (data.currentGuess === guessIndex) {
                return (
                  <fetcher.Form
                    method="post"
                    key={`current-guess-${data.currentGuess}`}
                    className=""
                    id="current-guess"
                    autoComplete="off"
                    onChange={(event) => {
                      const target = event.nativeEvent.target;
                      if (target instanceof HTMLInputElement) {
                        if (target.value === "") return;
                        if (target.nextElementSibling) {
                          const nextInput = target.nextElementSibling;
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
                          errorMessage ? "border-red-500" : "border-gray-900 empty:border-gray-400",
                        )}
                        type="text"
                        pattern="[a-zA-Z]{1}"
                        maxLength={1}
                        name="letter"
                        aria-label={`letter ${index + 1}`}
                        placeholder=" "
                        onClick={(event) => event.currentTarget.select()}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
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
                <div key={`guess-number-${guessIndex}`} className="">
                  {guess.letters.map((letter) => {
                    return (
                      <input
                        key={`guess-${guessIndex}-letter-${letter.id}`}
                        readOnly
                        className={clsx(
                          "inline-block aspect-square w-full border-4 text-center text-xl uppercase text-white",
                          {
                            "border-green-500 bg-green-500": letter.state === LetterState.Match,
                            "border-red-500 bg-red-500": letter.state === LetterState.Miss,
                            "border-yellow-500 bg-yellow-500": letter.state === LetterState.Present,
                            "border-gray-400": letter.state === LetterState.Blank,
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

          <div className="">
            {data.keyboardWithStatus.map((row, index) => {
              const letters = row.map((letter) => letter.letter).join("");
              return (
                <div
                  key={`keyboard-row-${letters}`}
                  className={clsx("flex justify-center gap-2", {
                    "mt-2": index > 0,
                  })}
                >
                  {row.map((letter) => {
                    return (
                      <div
                        className={clsx(``, {
                          "bg-green-500": letter.state === LetterState.Match,
                          "bg-red-500": letter.state === LetterState.Miss,
                          "bg-yellow-500": letter.state === LetterState.Present,
                          "bg-gray-400": letter.state === LetterState.Blank,
                        })}
                        key={`keyboard-letter-${letter.letter}`}
                      >
                        {letter.letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
