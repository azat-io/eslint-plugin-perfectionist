import type { CharacterClass } from '@eslint-community/regexpp/ast'

/**
 * Produces a normalized representation for a character class element.
 *
 * @param element - Character class element to transform.
 * @returns Normalized string used for comparisons.
 */
export function getCharacterClassElementValue(
  element: CharacterClass['elements'][number],
): string {
  let rawValue = element.raw

  switch (element.type) {
    case 'CharacterClassRange': {
      rawValue = `${String.fromCodePoint(element.min.value)}-${String.fromCodePoint(
        element.max.value,
      )}`

      break
    }
    case 'CharacterSet': {
      rawValue = `\\${element.kind}`

      break
    }
    case 'Character': {
      rawValue = String.fromCodePoint(element.value)

      break
    }
    /* No default. */
  }

  return rawValue
}
