import clsx from "clsx";
import { Link } from "@remix-run/react";

import { boardToEmoji } from "~/utils/board-to-emoji";
import checkIconUrl from "~/icons/check.svg";
import xIconUrl from "~/icons/x.svg";
import type { ComputedGuess } from "~/utils/game";

export function GameOverModal({
  currentGuess,
  guesses,
  totalGuesses,
  winner,
  word,
}: {
  currentGuess: number;
  guesses: Array<{
    letters: Array<Pick<ComputedGuess, "id" | "state" | "letter">>;
  }>;
  totalGuesses: number;
  winner: boolean;
  word: string;
}) {
  return (
    <div className="relative z-10" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
            <div>
              <div
                className={clsx(
                  "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
                  winner ? "bg-green-100" : "bg-red-100",
                )}
              >
                <svg
                  aria-hidden="true"
                  className={clsx(
                    "h-6 w-6",
                    winner ? "text-green-600" : "text-red-600",
                  )}
                >
                  <use
                    href={winner ? `${checkIconUrl}#check` : `${xIconUrl}#x`}
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Game Summary
                </h3>
                <div className="mt-2">
                  <div className="whitespace-pre">{boardToEmoji(guesses)}</div>
                  <button
                    type="button"
                    className="mx-auto my-4 flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                    onClick={async () => {
                      let guessString =
                        (winner ? currentGuess : "X") + "/" + totalGuesses;

                      let text =
                        `Remix Wordle - ${guessString} \n` +
                        boardToEmoji(guesses)
                          .split("\n")
                          .map((line) => line.trim())
                          .join("\n");
                      try {
                        let type = "text/plain";
                        let blob = new Blob([text], { type });
                        let write = [new ClipboardItem({ [type]: blob })];
                        await window.navigator.clipboard.write(write);
                      } catch (error) {
                        // browser doesn't support clipboard api
                      }
                    }}
                  >
                    Copy to clipboard 📋
                  </button>
                  <div className="mt-2 space-y-2 text-sm text-gray-500">
                    <p>
                      The word was <strong>{word}</strong>. Come back and try
                      again tomorrow
                    </p>

                    <p>
                      View your{" "}
                      <Link className="text-indigo-600" to="/history">
                        full game history
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
