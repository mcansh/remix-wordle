import { Letter, LetterState } from "@prisma/client";

type SmallLetter = Pick<Letter, "letter" | "state">;

function emojiRow(row: Array<SmallLetter>) {
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
  guesses: Array<{ letters: Array<SmallLetter> }>
): string {
  return guesses.flatMap((row) => emojiRow(row.letters)).join("\n");
}
