import type { CommonOptions } from '../../types/common-options'

import { convertBooleanToSign } from '../convert-boolean-to-sign'
import { buildStringFormatter } from './build-string-formatter'
import { computeOrderedValue } from './compute-ordered-value'

/**
 * Map of characters to their index positions in a custom alphabet. Used for
 * custom sorting to determine character priority.
 */
type IndexByCharacters = Map<string, number>

/**
 * Cache for pre-computed character index maps to avoid recalculating for the
 * same custom alphabets across multiple comparisons.
 */
let alphabetCache = new Map<string, IndexByCharacters>()

export function compareByCustomSort(
  a: string,
  b: string,
  {
    specialCharacters,
    ignoreCase,
    alphabet,
    order,
  }: Pick<
    CommonOptions,
    'specialCharacters' | 'ignoreCase' | 'alphabet' | 'order'
  >,
): number {
  let formatString = buildStringFormatter({
    specialCharacters,
    ignoreCase,
  })
  let indexByCharacters = alphabetCache.get(alphabet)

  if (!indexByCharacters) {
    indexByCharacters = new Map()
    for (let [index, character] of [...alphabet].entries()) {
      indexByCharacters.set(character, index)
    }
    alphabetCache.set(alphabet, indexByCharacters)
  }

  let aValue = formatString(a)
  let bValue = formatString(b)
  let minLength = Math.min(aValue.length, bValue.length)

  /* Iterate character by character. */
  for (let i = 0; i < minLength; i++) {
    let aCharacter = aValue[i]!
    let bCharacter = bValue[i]!
    let indexOfA = indexByCharacters.get(aCharacter)
    let indexOfB = indexByCharacters.get(bCharacter)
    indexOfA ??= Infinity
    indexOfB ??= Infinity

    if (indexOfA !== indexOfB) {
      return computeOrderedValue(
        convertBooleanToSign(indexOfA - indexOfB > 0),
        order,
      )
    }
  }

  if (aValue.length === bValue.length) {
    return 0
  }

  return computeOrderedValue(
    convertBooleanToSign(aValue.length - bValue.length > 0),
    order,
  )
}
