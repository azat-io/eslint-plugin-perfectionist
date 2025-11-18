import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Builds a value getter function for sorting object types.
 *
 * @param sortBy - Criteria to sort by ('value' or 'name').
 * @returns A function that retrieves the sort value from a node.
 */
export function buildNodeValueGetter(
  sortBy: 'value' | 'name',
): NodeValueGetterFunction<SortObjectTypesSortingNode> | null {
  switch (sortBy) {
    case 'value':
      return node => node.value ?? ''
    case 'name':
      return null
    /* v8 ignore next 2 */
    default:
      throw new UnreachableCaseError(sortBy)
  }
}
