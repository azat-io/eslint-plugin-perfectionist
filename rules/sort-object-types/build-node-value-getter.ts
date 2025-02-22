import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode } from './types'

export let buildNodeValueGetter = (
  sortBy: 'value' | 'name',
): NodeValueGetterFunction<SortObjectTypesSortingNode> | null =>
  sortBy === 'value' ? node => node.value ?? '' : null
