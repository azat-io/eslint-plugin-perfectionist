import type { CompareOptions } from './compare'
import type { SortingNode } from '../typings'

import { compare } from './compare'

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: CompareOptions,
): T[] => [...nodes].sort((a, b) => compare(a, b, options))
