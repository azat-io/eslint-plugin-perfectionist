import type { SortingNode } from '../typings'

import { compare } from './compare'

type SortType = 'alphabetical' | 'line-length' | 'natural'
type SortOrder = 'desc' | 'asc'

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: {
    'ignore-case'?: boolean
    order: SortOrder
    type: SortType
  },
): T[] => [...nodes].sort((a, b) => compare(a, b, options))
