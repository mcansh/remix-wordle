import { describe, test, expect } from "vitest";

import { computeGuess, isValidWord, LetterState } from "./game";

describe("computeGuess", () => {
  test("works with match and presents", () => {
    expect(computeGuess("boost", "basic")).toEqual([
      expect.objectContaining({ letter: "b", state: LetterState.Match }),
      expect.objectContaining({ letter: "o", state: LetterState.Miss }),
      expect.objectContaining({ letter: "o", state: LetterState.Miss }),
      expect.objectContaining({ letter: "s", state: LetterState.Present }),
      expect.objectContaining({ letter: "t", state: LetterState.Miss }),
    ]);
  });

  test("full match", () => {
    expect(computeGuess("boost", "boost")).toEqual([
      expect.objectContaining({ letter: "b", state: LetterState.Match }),
      expect.objectContaining({ letter: "o", state: LetterState.Match }),
      expect.objectContaining({ letter: "o", state: LetterState.Match }),
      expect.objectContaining({ letter: "s", state: LetterState.Match }),
      expect.objectContaining({ letter: "t", state: LetterState.Match }),
    ]);
  });

  test("full miss", () => {
    expect(computeGuess("guard", "boost")).toEqual([
      expect.objectContaining({ letter: "g", state: LetterState.Miss }),
      expect.objectContaining({ letter: "u", state: LetterState.Miss }),
      expect.objectContaining({ letter: "a", state: LetterState.Miss }),
      expect.objectContaining({ letter: "r", state: LetterState.Miss }),
      expect.objectContaining({ letter: "d", state: LetterState.Miss }),
    ]);
  });

  test("only does one match when two letters exist", () => {
    expect(computeGuess("solid", "boost")).toEqual([
      expect.objectContaining({ letter: "s", state: LetterState.Present }),
      expect.objectContaining({ letter: "o", state: LetterState.Match }),
      expect.objectContaining({ letter: "l", state: LetterState.Miss }),
      expect.objectContaining({ letter: "i", state: LetterState.Miss }),
      expect.objectContaining({ letter: "d", state: LetterState.Miss }),
    ]);
  });

  test("returns empty array when given incomplete guess", () => {
    expect(computeGuess("so", "boost")).toEqual([]);
  });

  test("when 2 letters are present but answer has only 1 of those letters", () => {
    expect(computeGuess("allol", "smelt")).toEqual([
      expect.objectContaining({ letter: "a", state: LetterState.Miss }),
      expect.objectContaining({ letter: "l", state: LetterState.Present }),
      expect.objectContaining({ letter: "l", state: LetterState.Miss }),
      expect.objectContaining({ letter: "o", state: LetterState.Miss }),
      expect.objectContaining({ letter: "l", state: LetterState.Miss }),
    ]);
  });

  test("when 1 letter matches but guess has more of the same letter", () => {
    expect(computeGuess("allol", "colon")).toEqual([
      expect.objectContaining({ letter: "a", state: LetterState.Miss }),
      expect.objectContaining({ letter: "l", state: LetterState.Miss }),
      expect.objectContaining({ letter: "l", state: LetterState.Match }),
      expect.objectContaining({ letter: "o", state: LetterState.Match }),
      expect.objectContaining({ letter: "l", state: LetterState.Miss }),
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
