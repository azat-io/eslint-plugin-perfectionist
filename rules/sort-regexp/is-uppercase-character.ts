import { codePointToString } from './code-point-to-string'

const UPPERCASE_CHARACTER_PATTERN = /^\p{Lu}$/u

/**
 * Determines whether the provided code point is an uppercase letter.
 *
 * @param value - Code point to evaluate.
 * @returns True when the value is uppercase.
 */
export function isUppercaseCharacter(value: number): boolean {
  return UPPERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}
