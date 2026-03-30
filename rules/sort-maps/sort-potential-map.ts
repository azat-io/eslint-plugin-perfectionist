import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { SortingNode } from '../../types/sorting-node'
import type { MessageId, Options } from './types'

import {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allSelectors,
  allModifiers,
} from './types'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
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
  partitionByComment: false,
  partitionByNewLine: false,
  newlinesBetween: 'ignore',
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export function sortPotentialMap({
  matchedAstSelectors,
  context,
  node,
}: {
  context: TSESLint.RuleContext<MessageId, Options>
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.NewExpression
}): void {
  if (
    node.callee.type !== AST_NODE_TYPES.Identifier ||
    node.callee.name !== 'Map' ||
    node.arguments.length === 0 ||
    node.arguments[0]?.type !== AST_NODE_TYPES.ArrayExpression
  ) {
    return
  }
  let [{ elements }] = node.arguments
  if (!isSortable(elements)) {
    return
  }

  let { sourceCode, id } = context
  let settings = getSettings(context.settings)

  let matchedContextOptions = computeMatchedContextOptions({
    matchedAstSelectors,
    elements,
    context,
  })

  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })

  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let parts: TSESTree.Expression[][] = elements.reduce(
    (
      accumulator: TSESTree.Expression[][],
      element: TSESTree.SpreadElement | TSESTree.Expression | null,
    ) => {
      if (element === null || element.type === AST_NODE_TYPES.SpreadElement) {
        accumulator.push([])
      } else {
        accumulator.at(-1)!.push(element)
      }
      return accumulator
    },
    [[]],
  )
  for (let part of parts) {
    let formattedMembers: SortingNode[][] = [[]]
    for (let element of part) {
      let name: string = computeNodeName({
        node: element,
        sourceCode,
      })

      let lastSortingNode = formattedMembers.at(-1)?.at(-1)

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

      let sortingNode: Omit<SortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(element, eslintDisabledLines),
        size: rangeToDiff(element, sourceCode),
        node: element,
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
        formattedMembers.push([])
      }

      formattedMembers.at(-1)!.push({
        ...sortingNode,
        partitionId: formattedMembers.length,
      })
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
        availableMessageIds: {
          missedSpacingBetweenMembers: MISSED_SPACING_ERROR_ID,
          extraSpacingBetweenMembers: EXTRA_SPACING_ERROR_ID,
          unexpectedGroupOrder: GROUP_ORDER_ERROR_ID,
          unexpectedOrder: ORDER_ERROR_ID,
        },
        sortNodesExcludingEslintDisabled:
          createSortNodesExcludingEslintDisabled(nodes),
        options,
        context,
        nodes,
      })
    }
  }
}
