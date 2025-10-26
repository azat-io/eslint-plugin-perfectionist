import { codePointToString } from './code-point-to-string'

const LOWERCASE_CHARACTER_PATTERN = /^\p{Ll}$/u

/**
 * Determines whether the provided code point is a lowercase letter.
 *
 * @param value - Code point to evaluate.
 * @returns True when the value is lowercase.
 */
export function isLowercaseCharacter(value: number): boolean {
  return LOWERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}
