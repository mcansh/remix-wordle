import wordBank from "./word-bank.json";

export enum LetterState {
  Blank, // The letter is blank
  Miss, // Letter doesn't exist at all
  Present, // Letter exists but wrong location
  Match, // Letter exists and is in the right location
}

export interface ComputedGuess {
  id: string;
  letter: string;
  state: LetterState;
}

function genId() {
  return Math.random().toString(36).substring(2, 15);
}

export function createEmptyLetter() {
  return { id: genId(), state: LetterState.Blank, letter: "" };
}

export function computeGuess(
  guess: string,
  answer: string,
): Array<ComputedGuess> {
  let result: Array<ComputedGuess> = [];

  if (guess.length !== answer.length) {
    return [];
  }

  let answerLetters = answer.split("");
  let guessLetters = guess.split("");

  let answerLetterCount: Record<string, number> = {};

  guessLetters.forEach((letter, index) => {
    let currentAnswerLetter = answerLetters[index];
    let count = answerLetterCount[currentAnswerLetter];
    answerLetterCount[currentAnswerLetter] = count ? count + 1 : 1;

    let id = genId();

    if (currentAnswerLetter === letter) {
      result.push({ id, letter, state: LetterState.Match });
    } else if (answer.includes(letter)) {
      result.push({ id, letter, state: LetterState.Present });
    } else {
      result.push({ id, letter, state: LetterState.Miss });
    }
  });

  result.forEach((curResult, resultIndex) => {
    if (curResult.state !== LetterState.Present) {
      return;
    }

    let guessLetter = guessLetters[resultIndex];

    answerLetters.forEach((currentAnswerLetter, answerIndex) => {
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
