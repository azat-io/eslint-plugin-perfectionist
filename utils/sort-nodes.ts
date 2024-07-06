import type { SortingNode, SortOrder, SortType } from '../typings'

import { compare } from './compare'

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: {
    ignoreCase?: boolean
    order: SortOrder
    type: SortType
  },
): T[] => [...nodes].sort((a, b) => compare(a, b, options))
