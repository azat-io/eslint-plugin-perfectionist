import type { SortingNode, SortType, SortOrder } from '../typings'

import { compare } from './compare'

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: {
    order: SortOrder
    type: SortType
  },
): T[] => [...nodes].sort((a, b) => Number(compare(a, b, options)) || -1)
