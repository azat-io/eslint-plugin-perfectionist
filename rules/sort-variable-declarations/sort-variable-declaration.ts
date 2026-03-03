import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  SortVariableDeclarationsSortingNode,
  MessageId,
  Selector,
  Options,
} from './types'
import type { Settings } from '../../utils/get-settings'

import {
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allSelectors,
} from './types'
import { computeDependenciesOutsideFunctionsBySortingNode } from '../../utils/compute-dependencies-outside-functions-by-sorting-node'
import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../../utils/generate-predefined-groups'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { computeDependencies } from './compute-dependencies'
import { computeGroup } from '../../utils/compute-group'
import { rangeToDiff } from '../../utils/range-to-diff'
import { computeNodeName } from './compute-node-name'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'

/**
 * Cache computed groups by modifiers and selectors for performance.
 */
let cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

export let defaultOptions: Required<Options[number]> = {
  useExperimentalDependencyDetection: true,
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  customGroups: [],
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export function sortVariableDeclaration({
  settings,
  context,
  node,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  node: TSESTree.VariableDeclaration
  settings: Settings
}): void {
  if (!isSortable(node.declarations)) {
    return
  }

  let { sourceCode, id } = context

  let matchedContextOptions = computeMatchedContextOptions({
    sourceCode,
    context,
    node,
  })

  let options = complete(matchedContextOptions, settings, defaultOptions)

  validateCustomSortConfiguration(options)
  validateNewlinesAndPartitionConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: [],
    options,
  })

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let sortingNodeGroups = node.declarations.reduce(
    (accumulator: SortVariableDeclarationsSortingNode[][], declaration) => {
      let name = computeNodeName({
        node: declaration,
        sourceCode,
      })

      let selector: Selector =
        declaration.init ? 'initialized' : 'uninitialized'

      let predefinedGroups = generatePredefinedGroups({
        cache: cachedGroupsByModifiersAndSelectors,
        selectors: [selector],
        modifiers: [],
      })

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      let sortingNode: Omit<
        SortVariableDeclarationsSortingNode,
        'partitionId'
      > = {
        group: computeGroup({
          customGroupMatcher: customGroup =>
            doesCustomGroupMatch({
              selectors: [selector],
              elementName: name,
              modifiers: [],
              customGroup,
            }),
          predefinedGroups,
          options,
        }),
        dependencies:
          options.useExperimentalDependencyDetection ?
            []
          : computeDependencies(declaration),
        isEslintDisabled: isNodeEslintDisabled(
          declaration,
          eslintDisabledLines,
        ),
        size: rangeToDiff(declaration, sourceCode),
        dependencyNames: [name],
        node: declaration,
        name,
      }

      if (
        shouldPartition({
          lastSortingNode,
          sortingNode,
          sourceCode,
          options,
        })
      ) {
        accumulator.push([])
      }

      accumulator.at(-1)?.push({
        ...sortingNode,
        partitionId: accumulator.length,
      })

      return accumulator
    },
    [[]],
  )

  if (options.useExperimentalDependencyDetection) {
    let dependenciesBySortingNode =
      computeDependenciesOutsideFunctionsBySortingNode({
        sortingNodes: sortingNodeGroups.flat(),
        sourceCode,
      })
    sortingNodeGroups = populateSortingNodeGroupsWithDependencies({
      dependenciesBySortingNode,
      sortingNodeGroups,
    })
  }
  let sortingNodes = sortingNodeGroups.flat()

  reportAllErrors<MessageId>({
    availableMessageIds: {
      missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
      unexpectedDependencyOrder: DEPENDENCY_ORDER_ERROR_ID,
      extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
      unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
      unexpectedOrder: ORDER_ERROR_ID,
    },
    sortNodesExcludingEslintDisabled,
    nodes: sortingNodes,
    options,
    context,
  })

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortVariableDeclarationsSortingNode[] {
    let nodesSortedByGroups = sortingNodeGroups.flatMap(sortingNodeGroup =>
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        nodes: sortingNodeGroup,
        groups: options.groups,
      }),
    )

    return sortNodesByDependencies(nodesSortedByGroups, {
      ignoreEslintDisabledNodes,
    })
  }
}
