import { ComputedGuess, LetterState } from ".";

function emojiRow(row: Array<ComputedGuess>) {
  let emoji = row.map((letter) => {
    switch (letter.state) {
      case LetterState.Match:
        return "🟩";
      case LetterState.Present:
        return "🟨";
      case LetterState.Miss:
        return "🟥";
      default:
        throw new Error("Unknown letter state");
    }
  });

  return emoji.join(" ");
}

export function boardToEmoji(board: Array<Array<ComputedGuess>>) {
  return board.flatMap((row) => emojiRow(row)).join("\n");
}
