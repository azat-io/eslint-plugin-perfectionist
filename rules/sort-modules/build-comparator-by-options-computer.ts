import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesOptions } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { buildUsageComparator } from './build-usage-comparator'

export function buildComparatorByOptionsComputer({
  ignoreEslintDisabledNodes,
  sortingNodes,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): ComparatorByOptionsComputer<
  Required<SortModulesOptions[number]>,
  SortModulesSortingNode
> {
  return options => {
    switch (options.type) {
      /* v8 ignore next -- @preserve Untested for now as not a relevant sort for this rule. */
      case 'subgroup-order':
      case 'alphabetical':
      case 'line-length':
      case 'unsorted':
      case 'natural':
      case 'custom':
        return defaultComparatorByOptionsComputer({
          ...options,
          type: options.type,
        })
      case 'usage':
        return buildUsageComparator({
          ignoreEslintDisabledNodes,
          sortingNodes,
          options,
        })
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(options.type)
    }
  }
}
