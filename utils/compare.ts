import naturalCompare from 'natural-compare-lite'

import type { SortingNode, SortOrder } from '~/typings'
import { SortType } from '~/typings'

export let compare = (
  a: SortingNode,
  b: SortingNode,
  options: {
    order: SortOrder
    type: SortType
  },
): boolean =>
  (options.order === 'asc' ? 1 : -1) *
    (options.type === SortType.natural ? naturalCompare(a.name, b.name) : a.size - b.size) >
  0
