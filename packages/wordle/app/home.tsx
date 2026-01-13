import type { Controller } from "@remix-run/fetch-router";

import { createRedirectResponse } from "@remix-run/response/redirect";
import clsx from "clsx";

import { Document } from "./components/document.tsx";
import { Form } from "./components/form.tsx";
import { GameOverModal } from "./components/game-over-modal.tsx";
import { LetterInput } from "./components/letter-input.tsx";
import { LETTER_INPUTS, TOTAL_GUESSES } from "./constants.ts";
import { requireAuth } from "./middleware/auth.ts";
import { createGuess, getFullBoard, getTodaysGame, isGameComplete } from "./models/game.ts";
import { routes } from "./routes.ts";
import { getCurrentUser } from "./utils/context.ts";
import { render } from "./utils/render.ts";

let REVEAL_WORD = "cheat";

export default {
  middleware: [requireAuth()],
  actions: {
    async action({ formData, session }) {
      const user = getCurrentUser();
      const letters = formData.getAll("letter");
      const revealWord = formData.get("cheat") === "true";

      const guessedWord = letters.join("");
      const error = await createGuess(user.id, guessedWord);

      if (error) {
        console.error({ error });
        session.flash("error", error);
      }

      return createRedirectResponse(
        routes.home.index.href(undefined, revealWord ? { cheat: "true" } : {}),
      );
    },

    async index({ url, session }) {
      const user = getCurrentUser();
      const game = await getTodaysGame(user.id);
      const board = getFullBoard(game);

      const showModal = isGameComplete(game.status);

      let showWord = showModal || url.searchParams.has(REVEAL_WORD) ? board.word : undefined;
      let keyboardWithStatus = board.keyboardWithStatus;

      let errorMessage = session.get("error") || null;

      if (typeof errorMessage !== "string") {
        errorMessage = null;
      }

      return render(
        <Document>
          <title>Remix Wordle</title>
          {showModal ? (
            <GameOverModal
              currentGuess={board.currentGuess}
              guesses={board.guesses}
              totalGuesses={TOTAL_GUESSES}
              winner={game.status === "WON"}
              word={board.word || ""}
            />
          ) : null}

          <div className="h-full" aria-hidden={showModal ? true : undefined}>
            <header>
              <h1 className="py-4 text-center text-4xl font-semibold">Remix Wordle</h1>
              {!showModal && showWord ? (
                <h2 className="mb-4 text-center text-sm text-gray-700">Your word is {showWord}</h2>
              ) : null}
            </header>

            <main>
              {errorMessage ? (
                <div className="mb-4 text-center text-red-500">{errorMessage}</div>
              ) : null}
              <div className="mx-auto max-w-sm space-y-4">
                {board.guesses.map((guess, guessIndex) => {
                  if (board.currentGuess === guessIndex) {
                    return (
                      <Form currentGuess={board.currentGuess}>
                        {showWord ? <input type="hidden" name="cheat" value="true" /> : null}
                        {LETTER_INPUTS.map((index) => (
                          <LetterInput
                            key={`input-number-${index}`}
                            index={index}
                            errorMessage={errorMessage}
                          />
                        ))}
                      </Form>
                    );
                  }

                  return (
                    <div key={`guess-number-${guessIndex}`} className="grid grid-cols-5 gap-4">
                      {guess.letters.map((letter) => {
                        return (
                          <input
                            key={`guess-${guessIndex}-letter-${letter.id}`}
                            readOnly
                            data-state={letter.state}
                            class={`inline-block aspect-square w-full border-4 text-center text-xl text-white uppercase data-[state=Blank]:border-gray-400 data-[state=Match]:border-green-500 data-[state=Match]:bg-green-500 data-[state=Miss]:border-red-500 data-[state=Miss]:bg-red-500 data-[state=Present]:border-yellow-500 data-[state=Present]:bg-yellow-500`}
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
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
                  value="Submit Guess"
                />
              </div>

              <div className="mx-auto max-w-md pt-10">
                {keyboardWithStatus.map((row, index) => {
                  const letters = row.map((letter) => letter.letter).join("");
                  return (
                    <div
                      key={`keyboard-row-${letters}`}
                      className={clsx("flex justify-center gap-2", { "mt-2": index > 0 })}
                    >
                      {row.map((letter) => {
                        return (
                          <div
                            data-state={letter.state}
                            class={`flex size-10 items-center justify-center rounded text-center text-white uppercase data-[state=Blank]:bg-gray-400 data-[state=Match]:bg-green-500 data-[state=Miss]:bg-red-500 data-[state=Present]:bg-yellow-500`}
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
        </Document>,
      );
    },
  },
} satisfies Controller<typeof routes.home>;
