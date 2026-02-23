import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortEnumsSortingNode, MessageId, Options } from './types'

import {
  DEPENDENCY_ORDER_ERROR_ID,
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
} from './types'
import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { buildComparatorByOptionsComputer } from './build-comparator-by-options-computer'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { computeExpressionNumberValue } from './compute-expression-number-value'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { getEnumMembers } from '../../utils/get-enum-members'
import { computeDependencies } from './compute-dependencies'
import { computeGroup } from '../../utils/compute-group'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'

export let defaultOptions: Required<Options[number]> = {
  useExperimentalDependencyDetection: true,
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  sortByValue: 'ifNumericEnum',
  partitionByComment: false,
  partitionByNewLine: false,
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  locales: 'en-US',
  customGroups: [],
  alphabet: '',
  order: 'asc',
  groups: [],
}

export function sortEnum({
  alreadyParsedNodes,
  astSelector,
  context,
  node,
}: {
  alreadyParsedNodes: Set<TSESTree.TSEnumDeclaration>
  context: Readonly<RuleContext<MessageId, Options>>
  node: TSESTree.TSEnumDeclaration
  astSelector: string | null
}): void {
  let members = getEnumMembers(node)
  if (
    !isSortable(members) ||
    !members.every(({ initializer }) => initializer)
  ) {
    return
  }

  let settings = getSettings(context.settings)

  let matchedContextOptions = computeMatchedContextOptions({
    enumMembers: members,
    astSelector,
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
    selectors: [],
    modifiers: [],
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let sortingNodeGroups: SortEnumsSortingNode[][] = members.reduce(
    (accumulator: SortEnumsSortingNode[][], member) => {
      let name = computeNodeName({ node: member, sourceCode })

      let group = computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            elementValue: sourceCode.getText(member.initializer),
            elementName: name,
            selectors: [],
            modifiers: [],
            customGroup,
          }),
        predefinedGroups: [],
        options,
      })

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      let sortingNode: Omit<SortEnumsSortingNode, 'partitionId'> = {
        dependencies:
          options.useExperimentalDependencyDetection ?
            []
          : computeDependencies(member.initializer!, node.id.name),
        value:
          member.initializer?.type === AST_NODE_TYPES.Literal ?
            (member.initializer.value?.toString() ?? null)
          : null,
        isEslintDisabled: isNodeEslintDisabled(member, eslintDisabledLines),
        numericValue: computeExpressionNumberValue(member.initializer!),
        size: rangeToDiff(member, sourceCode),
        dependencyNames: [name],
        node: member,
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
        accumulator.push([])
      }

      accumulator.at(-1)!.push({
        ...sortingNode,
        partitionId: accumulator.length,
      })
      return accumulator
    },
    [[]],
  )

  if (options.useExperimentalDependencyDetection) {
    let dependenciesBySortingNode = computeDependenciesBySortingNode({
      sortingNodes: sortingNodeGroups.flat(),
      enumName: node.id.name,
      sourceCode,
    })
    sortingNodeGroups = populateSortingNodeGroupsWithDependencies({
      dependenciesBySortingNode,
      sortingNodeGroups,
    })
  }
  let sortingNodes = sortingNodeGroups.flat()

  let isNumericEnum = sortingNodes.every(
    sortingNode => sortingNode.numericValue !== null,
  )

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
  ): SortEnumsSortingNode[] {
    let nodesSortedByGroups = sortingNodeGroups.flatMap(sortingNodeGroup =>
      sortNodesByGroups({
        comparatorByOptionsComputer:
          buildComparatorByOptionsComputer(isNumericEnum),
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
