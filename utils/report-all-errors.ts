import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { getFirstUnorderedNodeDependentOn } from './sort-nodes-by-dependencies'
import { createNodeIndexMap } from './create-node-index-map'
import { getNewlinesErrors } from './get-newlines-errors'
import { getGroupNumber } from './get-group-number'
import { reportErrors } from './report-errors'
import { pairwise } from './pairwise'

interface ReportAllErrorsParameters<MessageIds extends string> {
  availableMessageIds: {
    missedSpacingBetweenMembers?: MessageIds
    extraSpacingBetweenMembers?: MessageIds
    unexpectedDependencyOrder?: MessageIds
    unexpectedGroupOrder?: MessageIds
    unexpectedOrder: MessageIds
  }
  sortNodesExcludingEslintDisabled(
    ignoreEslintDisabledNodes: boolean,
  ): SortingNode[]
  options?: {
    groups?: GroupsOptions<string>
  } & MakeFixesParameters['options']
  context: TSESLint.RuleContext<MessageIds, unknown[]>
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  nodes: SortingNode[]
}

export let reportAllErrors = <MessageIds extends string>({
  ignoreFirstNodeHighestBlockComment,
  sortNodesExcludingEslintDisabled,
  availableMessageIds,
  sourceCode,
  context,
  options,
  nodes,
}: ReportAllErrorsParameters<MessageIds>): void => {
  let sortedNodes = sortNodesExcludingEslintDisabled(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesExcludingEslintDisabled(true)
  let nodeIndexMap = createNodeIndexMap(sortedNodes)

  pairwise(nodes, (left, right) => {
    let leftNumber = options?.groups ? getGroupNumber(options.groups, left) : 0
    let rightNumber = options?.groups
      ? getGroupNumber(options.groups, right)
      : 0

    let leftIndex = nodeIndexMap.get(left)!
    let rightIndex = nodeIndexMap.get(right)!

    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)

    let messageIds: MessageIds[] = []

    let firstUnorderedNodeDependentOnRight:
      | SortingNodeWithDependencies
      | undefined
    if (availableMessageIds.unexpectedDependencyOrder) {
      firstUnorderedNodeDependentOnRight = getFirstUnorderedNodeDependentOn(
        right as SortingNodeWithDependencies,
        nodes as SortingNodeWithDependencies[],
      )
    }

    if (
      firstUnorderedNodeDependentOnRight ||
      leftIndex > rightIndex ||
      leftIndex >= indexOfRightExcludingEslintDisabled
    ) {
      if (firstUnorderedNodeDependentOnRight) {
        messageIds.push(availableMessageIds.unexpectedDependencyOrder!)
      } else {
        messageIds.push(
          leftNumber === rightNumber ||
            !availableMessageIds.unexpectedGroupOrder
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }
    }

    if (
      options?.newlinesBetween &&
      options.groups &&
      availableMessageIds.missedSpacingBetweenMembers &&
      availableMessageIds.extraSpacingBetweenMembers
    ) {
      messageIds = [
        ...messageIds,
        ...getNewlinesErrors({
          options: {
            ...options,
            newlinesBetween: options.newlinesBetween,
            groups: options.groups,
          },
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          rightNum: rightNumber,
          leftNum: leftNumber,
          sourceCode,
          right,
          left,
        }),
      ]
    }

    reportErrors({
      sortedNodes: sortedNodesExcludingEslintDisabled,
      ignoreFirstNodeHighestBlockComment,
      firstUnorderedNodeDependentOnRight,
      messageIds,
      sourceCode,
      options,
      context,
      nodes,
      right,
      left,
    })
  })
}
