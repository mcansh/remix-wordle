import { GAME_RULES } from "./utils/game.ts"

export const WORD_LENGTH = GAME_RULES.wordLength
export const LETTER_INPUTS = Array.from({ length: WORD_LENGTH }, (_, i) => i)
export const TOTAL_GUESSES = GAME_RULES.maxGuesses
export const REVEAL_WORD = "cheat"
