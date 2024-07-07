import type { SortingNode } from '../typings'

import { compare } from './compare'

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: {
    type: 'alphabetical' | 'line-length' | 'natural'
    order: 'desc' | 'asc'
    ignoreCase?: boolean
  },
): T[] => [...nodes].sort((a, b) => compare(a, b, options))
