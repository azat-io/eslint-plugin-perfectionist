import type { Comparator } from './default-comparator-by-options-computer'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { computeOrderedValue } from './compute-ordered-value'

export function buildLineLengthComparator({
  order,
}: Pick<CommonOptions, 'order'>): Comparator<SortingNode> {
  return (a, b) => {
    let aSize = a.size
    let bSize = b.size

    let result = aSize - bSize
    return computeOrderedValue(result, order)
  }
}
