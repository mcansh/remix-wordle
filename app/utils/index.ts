import { Guess, Prisma, LetterState } from "@prisma/client";
import wordBank from "./word-bank.json";

type LetterNoId = Omit<Prisma.LetterUncheckedCreateInput, "guessId">;

export function computeGuess(
  guess: string,
  answerString: string
): Array<LetterNoId> {
  let result: Array<LetterNoId> = [];

  if (guess.length !== answerString.length) {
    return result;
  }

  let answer = answerString.split("");
  let guessAsArray = guess.split("");

  let answerLetterCount: Record<string, number> = {};

  guessAsArray.forEach((letter, index) => {
    let currentAnswerLetter = answer[index];
    let count = answerLetterCount[currentAnswerLetter];
    answerLetterCount[currentAnswerLetter] = count ? count + 1 : 1;

    if (currentAnswerLetter === letter) {
      result.push({ letter: letter, state: LetterState.Match });
    } else if (answer.includes(letter)) {
      result.push({ letter: letter, state: LetterState.Present });
    } else {
      result.push({ letter: letter, state: LetterState.Miss });
    }
  });

  result.forEach((curResult, resultIndex) => {
    if (curResult.state !== LetterState.Present) {
      return;
    }

    let guessLetter = guessAsArray[resultIndex];

    answer.forEach((currentAnswerLetter, answerIndex) => {
      if (currentAnswerLetter !== guessLetter) {
        return;
      }

      if (result[answerIndex].state === LetterState.Match) {
        result[resultIndex].state = LetterState.Miss;
      }

      if (answerLetterCount[guessLetter] <= 0) {
        result[resultIndex].state = LetterState.Miss;
      }
    });

    answerLetterCount[guessLetter]--;
  });

  return result;
}

export function getRandomWord(): string {
  return wordBank.valid[Math.floor(Math.random() * wordBank.valid.length)];
}

export function isValidWord(guess: string): boolean {
  return [...wordBank.valid, ...wordBank.invalid].includes(guess);
}
