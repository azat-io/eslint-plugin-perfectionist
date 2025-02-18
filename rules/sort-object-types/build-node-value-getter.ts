import type { SortObjectTypesSortingNode } from './types'

export let buildNodeValueGetter = (
  sortBy: 'value' | 'name',
): ((node: SortObjectTypesSortingNode) => string) | null =>
  sortBy === 'value' ? node => node.value ?? '' : null
