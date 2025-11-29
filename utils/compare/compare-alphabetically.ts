import type { CommonOptions } from '../../types/common-options'

import { buildStringFormatter } from './build-string-formatter'
import { computeOrderedValue } from './compute-ordered-value'

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
