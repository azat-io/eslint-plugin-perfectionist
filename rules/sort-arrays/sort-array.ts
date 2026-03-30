import type { RuleContext } from '@typescript-eslint/utils/ts-eslint'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import type { SortingNode } from '../../types/sorting-node'
import type { Selector, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { validateNewlinesAndPartitionConfig } from '../../utils/validate-newlines-and-partition-config'
import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'
import { validateCustomSortConfig } from '../../utils/validate-custom-sort-config'
import { computeMatchedContextOptions } from './compute-matched-context-options'
import { getEslintDisabledLines } from '../../utils/get-eslint-disabled-lines'
import { doesCustomGroupMatch } from '../../utils/does-custom-group-match'
import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'
import { validateGroupsConfig } from '../../utils/validate-groups-config'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { computeArrayElements } from './compute-array-elements'
import { reportAllErrors } from '../../utils/report-all-errors'
import { canReportErrors } from '../../utils/can-report-errors'
import { shouldPartition } from '../../utils/should-partition'
import { GroupMatcher } from '../../utils/group-matcher'
import { rangeToDiff } from '../../utils/range-to-diff'
import { getSettings } from '../../utils/get-settings'
import { computeNodeName } from './compute-node-name'
import { isSortable } from '../../utils/is-sortable'
import { complete } from '../../utils/complete'
import { allSelectors, allModifiers } from './types'

type SortArraySortingNode = SortingNode<
  TSESTree.SpreadElement | TSESTree.Expression
>

/**
 * Sorts the elements of an array-like expression.
 *
 * @param params - Parameters.
 * @param params.mustHaveMatchedContextOptions - Whether to skip nodes matching
 *   no option.
 * @param params.availableMessageIds - The message IDs to report with.
 * @param params.matchedAstSelectors - The AST selectors the node matched.
 * @param params.defaultOptions - The rule default options.
 * @param params.context - The rule context.
 * @param params.node - Array or `new` expression whose elements are sorted.
 */
export function sortArray<MessageIds extends string>({
  mustHaveMatchedContextOptions,
  availableMessageIds,
  matchedAstSelectors,
  defaultOptions,
  context,
  node,
}: {
  availableMessageIds: {
    missedSpacingBetweenMembers: MessageIds
    extraSpacingBetweenMembers: MessageIds
    unexpectedGroupOrder: MessageIds
    unexpectedOrder: MessageIds
  }
  node: TSESTree.ArrayExpression | TSESTree.NewExpression
  context: Readonly<RuleContext<MessageIds, Options>>
  defaultOptions: Required<Options[number]>
  matchedAstSelectors: ReadonlySet<string>
  mustHaveMatchedContextOptions: boolean
}): void {
  let elements = computeArrayElements(node)
  if (!elements) {
    return
  }

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

  if (mustHaveMatchedContextOptions && !matchedContextOptions) {
    return
  }

  let options = complete({
    options: matchedContextOptions,
    defaults: defaultOptions,
    settings,
  })
  validateCustomSortConfig(options)
  validateGroupsConfig({
    selectors: allSelectors,
    modifiers: allModifiers,
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

  let formattedMembers: SortArraySortingNode[][] = elements.reduce(
    (
      accumulator: SortArraySortingNode[][],
      element: TSESTree.SpreadElement | TSESTree.Expression | null,
    ) => {
      if (element === null) {
        return accumulator
      }

      if (element.type === AST_NODE_TYPES.SpreadElement) {
        accumulator.push([])
        return accumulator
      }

      let name = computeNodeName({ node: element, sourceCode })
      let selectors: Selector[] = ['literal']
      let group = groupMatcher.computeGroup({
        customGroupMatcher: customGroup =>
          doesCustomGroupMatch({
            selectors,
            elementName: name,
            modifiers: [],
            customGroup,
          }),
        modifiers: [],
        selectors,
      })

      let sortingNode: Omit<SortArraySortingNode, 'partitionId'> = {
        isEslintDisabled: isNodeEslintDisabled(element, eslintDisabledLines),
        size: rangeToDiff(element, sourceCode),
        node: element,
        group,
        name,
      }

      let lastSortingNode = accumulator.at(-1)?.at(-1)
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

  function sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortArraySortingNode[] {
    return formattedMembers.flatMap(nodes =>
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        optionsByGroupIndexComputer,
        ignoreEslintDisabledNodes,
        groups: options.groups,
        nodes,
      }),
    )
  }

  let nodes = formattedMembers.flat()
  reportAllErrors<MessageIds>({
    sortNodesExcludingEslintDisabled,
    availableMessageIds,
    options,
    context,
    nodes,
  })
}
