import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode } from './types'

/**
 * Builds a value getter function for sorting object types.
 *
 * @param sortBy - Criteria to sort by ('value' or 'name').
 * @returns A function that retrieves the sort value from a node.
 */
export function buildNodeValueGetter(
  sortBy: 'value' | 'name',
): NodeValueGetterFunction<SortObjectTypesSortingNode> | null {
  return sortBy === 'value' ? node => node.value ?? '' : null
}
