import wordBank from "./word-bank.json";

export enum LetterState {
  Blank, // The letter is blank
  Miss, // Letter doesn't exist at all
  Present, // Letter exists but wrong location
  Match, // Letter exists and is in the right location
}

export interface ComputedGuess {
  letter: string;
  state: LetterState;
  id: string;
}

function genId() {
  return Math.random().toString(16).slice(2);
}

export function createEmptyGuess() {
  return { letter: "", state: LetterState.Blank, id: genId() };
}

export function computeGuess(
  guess: string,
  answerString: string
): Array<ComputedGuess> {
  const result: Array<ComputedGuess> = [];

  if (guess.length !== answerString.length) {
    return result;
  }

  const answer = answerString.split("");

  const guessAsArray = guess.split("");

  const answerLetterCount: Record<string, number> = {};

  guessAsArray.forEach((letter, index) => {
    const currentAnswerLetter = answer[index];

    answerLetterCount[currentAnswerLetter] = answerLetterCount[
      currentAnswerLetter
    ]
      ? answerLetterCount[currentAnswerLetter] + 1
      : 1;

    if (currentAnswerLetter === letter) {
      result.push({ letter: letter, state: LetterState.Match, id: genId() });
    } else if (answer.includes(letter)) {
      result.push({ letter: letter, state: LetterState.Present, id: genId() });
    } else {
      result.push({ letter: letter, state: LetterState.Miss, id: genId() });
    }
  });

  result.forEach((curResult, resultIndex) => {
    if (curResult.state !== LetterState.Present) {
      return;
    }

    const guessLetter = guessAsArray[resultIndex];

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
  return wordBank.valid.concat(wordBank.invalid).includes(guess);
}

export function isValidGuess(guess: unknown): guess is ComputedGuess {
  return (
    Array.isArray(guess) &&
    guess.every(
      (letter) =>
        typeof letter === "object" &&
        typeof letter.letter === "string" &&
        typeof letter.state === "number" &&
        typeof letter.id === "string"
    )
  );
}
