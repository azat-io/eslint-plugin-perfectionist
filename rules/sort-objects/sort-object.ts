import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  SortObjectsSortingNode,
  MessageId,
  Modifier,
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
  allModifiers,
  allSelectors,
} from './types'
import { computeDependenciesOutsideFunctionsBySortingNode } from '../../utils/compute-dependencies-outside-functions-by-sorting-node'
import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { computePropertyOrVariableDeclaratorName } from './compute-property-or-variable-declarator-name'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { generatePredefinedGroups } from '../../utils/generate-predefined-groups'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { comparatorByOptionsComputer } from './comparator-by-options-computer'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { isNodeOnSingleLine } from '../../utils/is-node-on-single-line'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { computeDependencyNames } from './compute-dependency-names'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { computeDependencies } from './compute-dependencies'
import { computeGroup } from '../../utils/compute-group'
import { isStyleComponent } from './is-style-component'
import { rangeToDiff } from '../../utils/range-to-diff'
import { computeNodeValue } from './compute-node-value'
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
  partitionByComputedKey: false,
  partitionByNewLine: false,
  partitionByComment: false,
  newlinesBetween: 'ignore',
  specialCharacters: 'keep',
  styledComponents: true,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  sortBy: 'name',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export function sortObject({
  alreadyParsedNodes,
  astSelector,
  settings,
  context,
  node,
}: {
  alreadyParsedNodes: Set<TSESTree.ObjectExpression | TSESTree.ObjectPattern>
  context: Readonly<TSESLint.RuleContext<MessageId, Options>>
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  astSelector: string | null
  settings: Settings
}): void {
  if (!isSortable(node.properties)) {
    return
  }

  let { sourceCode, id } = context

  let isDestructuredObject = node.type === AST_NODE_TYPES.ObjectPattern
  let matchedContextOptions = computeMatchedContextOptions({
    isDestructuredObject,
    nodeObject: node,
    astSelector,
    sourceCode,
    context,
  })
  if (!matchedContextOptions && astSelector) {
    return
  }

  if (alreadyParsedNodes.has(node)) {
    return
  }
  alreadyParsedNodes.add(node)

  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  if (!options.styledComponents && isStyleComponent(node)) {
    return
  }

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let sortingNodeGroups: SortObjectsSortingNode[][] = [[]]
  for (let property of node.properties) {
    if (
      property.type === AST_NODE_TYPES.SpreadElement ||
      property.type === AST_NODE_TYPES.RestElement
    ) {
      sortingNodeGroups.push([])
      continue
    }

    if (
      options.partitionByComputedKey &&
      !isDestructuredObject &&
      property.computed
    ) {
      sortingNodeGroups.push([])
      continue
    }

    let lastSortingNode = sortingNodeGroups.at(-1)?.at(-1)

    let selectors: Selector[] = []
    let modifiers: Modifier[] = []

    if (
      property.value.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      property.value.type === AST_NODE_TYPES.FunctionExpression
    ) {
      selectors.push('method')
    } else {
      selectors.push('property')
    }

    selectors.push('member')

    if (!isNodeOnSingleLine(property)) {
      modifiers.push('multiline')
    }

    let name = computePropertyOrVariableDeclaratorName({
      node: property,
      sourceCode,
    })
    let dependencyNames = [name]
    if (isDestructuredObject) {
      dependencyNames = [...new Set(computeDependencyNames(property.value))]
    }

    let value = computeNodeValue({
      isDestructuredObject,
      sourceCode,
      property,
    })

    let predefinedGroups = generatePredefinedGroups({
      cache: cachedGroupsByModifiersAndSelectors,
      selectors,
      modifiers,
    })
    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          elementValue: value,
          elementName: name,
          customGroup,
          selectors,
          modifiers,
        }),
      predefinedGroups,
      options,
    })

    let sortingNode: Omit<SortObjectsSortingNode, 'partitionId'> = {
      dependencies:
        options.useExperimentalDependencyDetection ?
          []
        : computeDependencies(property),
      isEslintDisabled: isNodeEslintDisabled(property, eslintDisabledLines),
      size: rangeToDiff(property, sourceCode),
      value: value ?? '',
      dependencyNames,
      node: property,
      group,
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
      sortingNodeGroups.push([])
    }

    sortingNodeGroups.at(-1)!.push({
      ...sortingNode,
      partitionId: sortingNodeGroups.length,
    })
  }

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
  ): SortObjectsSortingNode[] {
    let nodesSortedByGroups = sortingNodeGroups.flatMap(nodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )

    return sortNodesByDependencies(nodesSortedByGroups, {
      ignoreEslintDisabledNodes,
    })
  }
}
