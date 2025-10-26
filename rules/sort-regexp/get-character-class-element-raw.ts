import type { CharacterClass } from '@eslint-community/regexpp/ast'

/**
 * Returns the raw representation of a character class element.
 *
 * @param element - Character class element to read.
 * @returns Raw text of the element.
 */
export function getCharacterClassElementRaw(
  element: CharacterClass['elements'][number],
): string {
  return element.raw
}
