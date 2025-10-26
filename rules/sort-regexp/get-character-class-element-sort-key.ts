import type { CharacterClass } from '@eslint-community/regexpp/ast'

import { getCharacterClassElementCategory } from './get-character-class-element-category'
import { getCharacterClassElementValue } from './get-character-class-element-value'
import { getCharacterClassElementRaw } from './get-character-class-element-raw'

export interface CharacterClassElementSortKey {
  normalized: string
  category: number
  raw: string
}

/**
 * Builds a composite key describing how a character class element should sort.
 *
 * @param element - Character class element to analyze.
 * @returns Sort key used by character class sorting routines.
 */
export function getCharacterClassElementSortKey(
  element: CharacterClass['elements'][number],
): CharacterClassElementSortKey {
  return {
    category: getCharacterClassElementCategory(element),
    normalized: getCharacterClassElementValue(element),
    raw: getCharacterClassElementRaw(element),
  }
}
