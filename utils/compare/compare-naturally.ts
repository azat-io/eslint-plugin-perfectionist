import { compare as createNaturalCompare } from 'natural-orderby'

import type { CommonOptions } from '../../types/common-options'

import { buildStringFormatter } from './build-string-formatter'
import { computeOrderedValue } from './compute-ordered-value'

export function compareNaturally(
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
  let naturalCompare = createNaturalCompare({
    locale: locales.toString(),
  })
  let formatString = buildStringFormatter({
    specialCharacters,
    ignoreCase,
  })

  let result = naturalCompare(formatString(a), formatString(b))
  return computeOrderedValue(result, order)
}
