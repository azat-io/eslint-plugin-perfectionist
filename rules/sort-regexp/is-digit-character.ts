import { codePointToString } from './code-point-to-string'

const DIGIT_CHARACTER_PATTERN = /^\p{Nd}$/u

/**
 * Checks whether the given code point represents a digit character.
 *
 * @param value - Code point to inspect.
 * @returns True when the value corresponds to a digit character.
 */
export function isDigitCharacter(value: number): boolean {
  return DIGIT_CHARACTER_PATTERN.test(codePointToString(value))
}
