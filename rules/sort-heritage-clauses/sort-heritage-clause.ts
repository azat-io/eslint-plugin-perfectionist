import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../../types/sorting-node'
import type { MessageId, Options } from './types'

import {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allModifiers,
  allSelectors,
} from './types'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { validateNewlinesAndPartitionConfig } from '../../utils/validate-newlines-and-partition-config'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfig } from '../../utils/validate-custom-sort-config'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { validateGroupsConfig } from '../../utils/validate-groups-config'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { canReportErrors } from '../../utils/can-report-errors'
import { shouldPartition } from '../../utils/should-partition'
import { computeGroup } from '../../utils/compute-group'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'

export let defaultOptions: Required<Options[number]> = {
  fallbackSort: { type: 'unsorted' },
  newlinesInside: 'newlinesBetween',
  specialCharacters: 'keep',
  newlinesBetween: 'ignore',
  partitionByNewLine: false,
  partitionByComment: false,
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

let availableMessageIds = {
  missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
  extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
  unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
  unexpectedOrder: ORDER_ERROR_ID,
} as const

/**
 * Sorts the types of an `extends` or `implements` clause.
 *
 * @param params - Parameters.
 * @param params.matchedAstSelectors - The AST selectors the node matched.
 * @param params.context - The rule context.
 * @param params.node - Class or interface declaring the clause.
 */
export function sortHeritageClause({
  matchedAstSelectors,
  context,
  node,
}: {
  node: TSESTree.TSInterfaceDeclaration | TSESTree.ClassDeclaration
  context: TSESLint.RuleContext<MessageId, Options>
  matchedAstSelectors: ReadonlySet<string>
}): void {
  let heritageClauses =
    node.type === AST_NODE_TYPES.TSInterfaceDeclaration ?
      node.extends
    : node.implements

  if (!isSortable(heritageClauses)) {
    return
  }

  let settings = getSettings(context.settings)
  let matchedContextOptions = computeMatchedContextOptions({
    matchedAstSelectors,
    heritageClauses,
    context,
  })

  let options = complete({
    options: matchedContextOptions,
    defaults: defaultOptions,
    settings,
  })
  validateCustomSortConfig(options)
  validateGroupsConfig({
    modifiers: allModifiers,
    selectors: allSelectors,
    options,
  })
  validateNewlinesAndPartitionConfig(options)

  if (
    !canReportErrors({
      comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
      newlinesBetweenValueGetter: undefined,
      canHaveDependencies: false,
      availableMessageIds,
      options,
    })
  ) {
    return
  }

  let { sourceCode, id } = context
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedMembers: SortingNode[][] = [[]]
  for (let heritageClause of heritageClauses) {
    let name = computeNodeName(heritageClause.expression)

    let group = computeGroup({
      customGroupMatcher: customGroup =>
        doesCustomGroupMatch({
          elementName: name,
          selectors: [],
          modifiers: [],
          customGroup,
        }),
      predefinedGroups: [],
      options,
    })

    let sortingNode: SortingNode = {
      isEslintDisabled: isNodeEslintDisabled(
        heritageClause,
        eslintDisabledLines,
      ),
      size: rangeToDiff(heritageClause, sourceCode),
      node: heritageClause,
      partitionId: 0,
      group,
      name,
    }

    let lastSortingNode = formattedMembers.at(-1)?.at(-1)
    if (
      shouldPartition({
        lastSortingNode,
        sortingNode,
        sourceCode,
        options,
      })
    ) {
      formattedMembers.push([])
    }

    formattedMembers.at(-1)!.push(sortingNode)
  }

  for (let nodes of formattedMembers) {
    function createSortNodesExcludingEslintDisabled(
      sortingNodes: SortingNode[],
    ) {
      return function (ignoreEslintDisabledNodes: boolean): SortingNode[] {
        return sortNodesByGroups({
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          optionsByGroupIndexComputer,
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes: sortingNodes,
        })
      }
    }

    reportAllErrors<MessageId>({
      sortNodesExcludingEslintDisabled:
        createSortNodesExcludingEslintDisabled(nodes),
      availableMessageIds,
      options,
      context,
      nodes,
    })
  }
}
