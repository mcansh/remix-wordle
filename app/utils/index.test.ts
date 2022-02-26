import { computeGuess, isValidWord, LetterState } from "./index";

describe("computeGuess", () => {
  test("works with match and presents", () => {
    expect(computeGuess("boost", "basic")).toEqual([
      { letter: "b", state: LetterState.Match },
      { letter: "o", state: LetterState.Miss },
      { letter: "o", state: LetterState.Miss },
      { letter: "s", state: LetterState.Present },
      { letter: "t", state: LetterState.Miss },
    ]);
  });

  test("full match", () => {
    expect(computeGuess("boost", "boost")).toEqual([
      { letter: "b", state: LetterState.Match },
      { letter: "o", state: LetterState.Match },
      { letter: "o", state: LetterState.Match },
      { letter: "s", state: LetterState.Match },
      { letter: "t", state: LetterState.Match },
    ]);
  });

  test("full miss", () => {
    expect(computeGuess("guard", "boost")).toEqual([
      { letter: "g", state: LetterState.Miss },
      { letter: "u", state: LetterState.Miss },
      { letter: "a", state: LetterState.Miss },
      { letter: "r", state: LetterState.Miss },
      { letter: "d", state: LetterState.Miss },
    ]);
  });

  test("only does one match when two letters exist", () => {
    expect(computeGuess("solid", "boost")).toEqual([
      { letter: "s", state: LetterState.Present },
      { letter: "o", state: LetterState.Match },
      { letter: "l", state: LetterState.Miss },
      { letter: "i", state: LetterState.Miss },
      { letter: "d", state: LetterState.Miss },
    ]);
  });

  test("returns empty array when given incomplete guess", () => {
    expect(computeGuess("so", "boost")).toEqual([]);
  });

  test("when 2 letters are present but answer has only 1 of those letters", () => {
    expect(computeGuess("allol", "smelt")).toEqual([
      { letter: "a", state: LetterState.Miss },
      { letter: "l", state: LetterState.Present },
      { letter: "l", state: LetterState.Miss },
      { letter: "o", state: LetterState.Miss },
      { letter: "l", state: LetterState.Miss },
    ]);
  });

  test("when 1 letter matches but guess has more of the same letter", () => {
    expect(computeGuess("allol", "colon")).toEqual([
      { letter: "a", state: LetterState.Miss },
      { letter: "l", state: LetterState.Miss },
      { letter: "l", state: LetterState.Match },
      { letter: "o", state: LetterState.Match },
      { letter: "l", state: LetterState.Miss },
    ]);
  });
});

describe("isValidWord", () => {
  test("with valid word", () => {
    expect(isValidWord("boost")).toBe(true);
  });

  test("with invalid word", () => {
    expect(isValidWord("lulze")).toBe(false);
  });
});
