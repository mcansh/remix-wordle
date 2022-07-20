import { ComputedGuess, LetterState } from "./game";

function emojiRow(row: Array<ComputedGuess>) {
  let emoji = row.map((letter) => {
    switch (letter.state) {
      case LetterState.Match:
        return "🟩";
      case LetterState.Present:
        return "🟨";
      case LetterState.Miss:
        return "🟥";
      case LetterState.Blank:
        return "⬜️";
      default:
        throw new Error("Unknown letter state");
    }
  });

  return emoji.join(" ");
}

export function boardToEmoji(
  guesses: Array<{ letters: Array<ComputedGuess> }>
): string {
  return guesses.flatMap((row) => emojiRow(row.letters)).join("\n");
}
