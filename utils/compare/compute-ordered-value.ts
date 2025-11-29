import type { CommonOptions } from '../../types/common-options'

import { UnreachableCaseError } from '../unreachable-case-error'

export function computeOrderedValue(
  value: number,
  order: CommonOptions['order'],
): number {
  switch (order) {
    case 'desc':
      return -value
    case 'asc':
      return value
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(order)
  }
}
