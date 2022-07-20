import clsx from "clsx";
import { boardToEmoji } from "~/utils/board-to-emoji";
import checkIconUrl from "~/icons/check.svg";
import xIconUrl from "~/icons/x.svg";
import { Letter } from "@prisma/client";

export function GameOverModal({
  currentGuess,
  guesses,
  totalGuesses,
  winner,
  word,
}: {
  currentGuess: number;
  guesses: Array<{ letters: Array<Pick<Letter, "id" | "state" | "letter">> }>;
  totalGuesses: number;
  winner: boolean;
  word: string;
}) {
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
                  <div className="whitespace-pre">{boardToEmoji(guesses)}</div>
                  <button
                    type="button"
                    onClick={async () => {
                      let guessString = winner
                        ? currentGuess
                        : "X" + "/" + totalGuesses;
                      let text =
                        `Remix Wordle - ${guessString} \n` +
                        boardToEmoji(guesses)
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
                    The word was <strong>{word}</strong>. Come back and try
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
