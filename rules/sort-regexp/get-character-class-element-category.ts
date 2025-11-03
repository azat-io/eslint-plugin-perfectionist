import type { CharacterClass } from '@eslint-community/regexpp/ast'

const DIGIT_CHARACTER_PATTERN = /^\p{Nd}$/u
const LOWERCASE_CHARACTER_PATTERN = /^\p{Ll}$/u
const UPPERCASE_CHARACTER_PATTERN = /^\p{Lu}$/u

/**
 * Maps a character class element to a sortable category bucket.
 *
 * @param element - Character class element to categorize.
 * @returns Numeric category representing the element group.
 */
export function getCharacterClassElementCategory(
  element: CharacterClass['elements'][number],
): number {
  let category = 4

  switch (element.type) {
    case 'CharacterClassRange': {
      if (
        isDigitCharacter(element.min.value) &&
        isDigitCharacter(element.max.value)
      ) {
        category = 0
      } else if (
        isUppercaseCharacter(element.min.value) &&
        isUppercaseCharacter(element.max.value)
      ) {
        category = 1
      } else if (
        isLowercaseCharacter(element.min.value) &&
        isLowercaseCharacter(element.max.value)
      ) {
        category = 2
      } else {
        category = 3
      }

      break
    }
    case 'CharacterSet': {
      switch (element.kind) {
        case 'digit': {
          category = 0

          break
        }
        case 'space': {
          category = 3

          break
        }
        case 'word': {
          category = 2

          break
        }
        // No default
      }

      break
    }
    case 'Character': {
      if (isDigitCharacter(element.value)) {
        category = 0
      } else if (isUppercaseCharacter(element.value)) {
        category = 1
      } else if (isLowercaseCharacter(element.value)) {
        category = 2
      } else {
        category = 3
      }

      break
    }
    /* No default. */
  }

  return category
}

/**
 * Determines whether the provided code point is a lowercase letter.
 *
 * @param value - Code point to evaluate.
 * @returns True when the value is lowercase.
 */
export function isLowercaseCharacter(value: number): boolean {
  return LOWERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}

/**
 * Determines whether the provided code point is an uppercase letter.
 *
 * @param value - Code point to evaluate.
 * @returns True when the value is uppercase.
 */
export function isUppercaseCharacter(value: number): boolean {
  return UPPERCASE_CHARACTER_PATTERN.test(codePointToString(value))
}

/**
 * Checks whether the given code point represents a digit character.
 *
 * @param value - Code point to inspect.
 * @returns True when the value corresponds to a digit character.
 */
export function isDigitCharacter(value: number): boolean {
  return DIGIT_CHARACTER_PATTERN.test(codePointToString(value))
}

/**
 * Converts the provided code point into its string representation.
 *
 * @param value - Code point to convert.
 * @returns String representation of the code point.
 */
function codePointToString(value: number): string {
  return String.fromCodePoint(value)
}
