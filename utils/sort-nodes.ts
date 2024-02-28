import type { SortingNode } from '../typings'

import { compare } from './compare'

export let sortNodes = <T extends SortingNode<unknown>>(
  nodes: T[],
  options: {
    type: 'alphabetical' | 'line-length' | 'natural'
    'ignore-case'?: boolean
    order: 'desc' | 'asc'
  },
): T[] => [...nodes].sort((a, b) => compare(a, b, options))
