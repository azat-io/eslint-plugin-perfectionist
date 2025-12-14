import type { CommonOptions } from '../../types/common-options'

import { buildStringFormatter } from './build-string-formatter'
import { computeOrderedValue } from './compute-ordered-value'

/**
 * Compares two strings alphabetically using locale-aware comparison.
 *
 * Applies string formatting based on options (case sensitivity, special
 * characters handling) before performing the comparison.
 *
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @param options - Comparison options.
 * @param options.specialCharacters - How to handle special characters.
 * @param options.ignoreCase - Whether to ignore case differences.
 * @param options.locales - The locale(s) to use for comparison.
 * @param options.order - The order direction ('asc' or 'desc').
 * @returns A negative number if a < b, positive if a > b, or 0 if equal.
 */
export function compareAlphabetically(
  a: string,
  b: string,
  {
    specialCharacters,
    ignoreCase,
    locales,
    order,
  }: Pick<
    CommonOptions,
    'specialCharacters' | 'ignoreCase' | 'locales' | 'order'
  >,
): number {
  let formatString = buildStringFormatter({
    specialCharacters,
    ignoreCase,
  })
  let result = formatString(a).localeCompare(formatString(b), locales)
  return computeOrderedValue(result, order)
}
