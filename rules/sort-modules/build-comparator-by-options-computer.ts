import type { TSESLint } from '@typescript-eslint/utils'

import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { buildUsageComparator } from './build-usage-comparator'

export function buildComparatorByOptionsComputer({
  useExperimentalDependencyDetection,
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
}: {
  useExperimentalDependencyDetection: boolean
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortModulesSortingNode
> {
  return options => {
    switch (options.type) {
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
          useExperimentalDependencyDetection,
          ignoreEslintDisabledNodes,
          sortingNodes,
          sourceCode,
          options,
        })
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(options.type)
    }
  }
}
