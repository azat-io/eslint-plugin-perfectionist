import type { CharacterClass } from '@eslint-community/regexpp/ast'

import { isLowercaseCharacter } from './is-lowercase-character'
import { isUppercaseCharacter } from './is-uppercase-character'
import { isDigitCharacter } from './is-digit-character'

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
