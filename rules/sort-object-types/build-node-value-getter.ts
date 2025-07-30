import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode } from './types'

export function buildNodeValueGetter(
  sortBy: 'value' | 'name',
): NodeValueGetterFunction<SortObjectTypesSortingNode> | null {
  return sortBy === 'value' ? node => node.value ?? '' : null
}
