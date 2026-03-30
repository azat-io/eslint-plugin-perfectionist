import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Modifier, Selector, Options } from './types'
import type { SortingNode } from '../../types/sorting-node'

import {
  MISSED_SPACING_ERROR_ID,
  EXTRA_SPACING_ERROR_ID,
  GROUP_ORDER_ERROR_ID,
  ORDER_ERROR_ID,
  allModifiers,
  allSelectors,
} from './types'
import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'
import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'
import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { isNodeOnSingleLine } from '../../utils/is-node-on-single-line'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { reportAllErrors } from '../../utils/report-all-errors'
import { shouldPartition } from '../../utils/should-partition'
import { GroupMatcher } from '../../utils/group-matcher'
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
  useConfigurationIf: {},
  type: 'alphabetical',
  ignoreCase: true,
  customGroups: [],
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
  groups: [],
}

export function sortJsxObject({
  matchedAstSelectors,
  context,
  node,
}: {
  context: Readonly<TSESLint.RuleContext<MessageId, Options>>
  matchedAstSelectors: ReadonlySet<string>
  node: TSESTree.JSXElement
}): void {
  if (!isSortable(node.openingElement.attributes)) {
    return
  }

  let { sourceCode, id } = context
  let settings = getSettings(context.settings)

  let matchedContextOptions = computeMatchedContextOptions({
    matchedAstSelectors,
    sourceCode,
    context,
    node,
  })

  let options = complete(matchedContextOptions, settings, defaultOptions)
  validateCustomSortConfiguration(options)
  validateGroupsConfiguration({
    selectors: allSelectors,
    modifiers: allModifiers,
    options,
  })
  validateNewlinesAndPartitionConfiguration(options)

  let groupMatcher = new GroupMatcher({
    allModifiers,
    allSelectors,
    options,
  })
  let eslintDisabledLines = getEslintDisabledLines({
    ruleName: id,
    sourceCode,
  })
  let optionsByGroupIndexComputer = buildOptionsByGroupIndexComputer(options)

  let formattedMembers: SortingNode[][] = node.openingElement.attributes.reduce(
    (
      accumulator: SortingNode[][],
      attribute: TSESTree.JSXSpreadAttribute | TSESTree.JSXAttribute,
    ) => {
      if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
        accumulator.push([])
        return accumulator
      }

      let name = computeNodeName(attribute)

      let selectors: Selector[] = []
      let modifiers: Modifier[] = []

      if (attribute.value === null) {
        modifiers.push('shorthand')
      }
      if (!isNodeOnSingleLine(attribute)) {
        modifiers.push('multiline')
      }
      selectors.push('prop')

      let group = groupMatcher.computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            elementValue:
              attribute.value ? sourceCode.getText(attribute.value) : null,
            elementName: name,
            customGroup,
            selectors,
            modifiers,
          }),
        selectors,
        modifiers,
      })

      let sortingNode: Omit<SortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(attribute, eslintDisabledLines),
        size: rangeToDiff(attribute, sourceCode),
        node: attribute,
        group,
        name,
      }

      let lastSortingNode = accumulator.at(-1)?.at(-1)
      if (
        shouldPartition({
          options: {
            partitionByNewLine: options.partitionByNewLine,
            partitionByComment: false,
          },
          lastSortingNode,
          sortingNode,
          sourceCode,
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

  for (let currentNodes of formattedMembers) {
    function createSortNodesExcludingEslintDisabled(nodes: SortingNode[]) {
      return function (ignoreEslintDisabledNodes: boolean): SortingNode[] {
        return sortNodesByGroups({
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          optionsByGroupIndexComputer,
          ignoreEslintDisabledNodes,
          groups: options.groups,
          nodes,
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
        createSortNodesExcludingEslintDisabled(currentNodes),
      options: {
        ...options,
        partitionByComment: false,
      },
      nodes: currentNodes,
      context,
    })
  }
}
