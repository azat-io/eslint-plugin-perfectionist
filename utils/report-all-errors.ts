import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { NewlinesBetweenValueGetter } from './get-newlines-errors'
import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { computeNodesInCircularDependencies } from './compute-nodes-in-circular-dependencies'
import { isNodeDependentOnOtherNode } from './is-node-dependent-on-other-node'
import { createNodeIndexMap } from './create-node-index-map'
import { getNewlinesErrors } from './get-newlines-errors'
import { getGroupNumber } from './get-group-number'
import { reportErrors } from './report-errors'
import { pairwise } from './pairwise'

interface ReportAllErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  availableMessageIds: {
    missedSpacingBetweenMembers?: MessageIds
    extraSpacingBetweenMembers?: MessageIds
    unexpectedDependencyOrder?: MessageIds
    unexpectedGroupOrder?: MessageIds
    unexpectedOrder: MessageIds
  }
  options: {
    groups?: GroupsOptions<string>
  } & MakeFixesParameters<T>['options']
  sortNodesExcludingEslintDisabled(ignoreEslintDisabledNodes: boolean): T[]
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>
  context: TSESLint.RuleContext<MessageIds, unknown[]>
  ignoreFirstNodeHighestBlockComment?: boolean
  sourceCode: TSESLint.SourceCode
  nodes: T[]
}

export let reportAllErrors = <
  MessageIds extends string,
  T extends SortingNode = SortingNode,
>({
  ignoreFirstNodeHighestBlockComment,
  sortNodesExcludingEslintDisabled,
  newlinesBetweenValueGetter,
  availableMessageIds,
  sourceCode,
  context,
  options,
  nodes,
}: ReportAllErrorsParameters<MessageIds, T>): void => {
  let sortedNodes = sortNodesExcludingEslintDisabled(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesExcludingEslintDisabled(true)
  let nodeIndexMap = createNodeIndexMap(sortedNodes)
  let nodesInCircularDependencies =
    availableMessageIds.unexpectedDependencyOrder
      ? computeNodesInCircularDependencies(
          nodes as unknown as SortingNodeWithDependencies[],
        )
      : new Set<SortingNodeWithDependencies>()

  pairwise(nodes, (left, right) => {
    let leftNumber = options.groups ? getGroupNumber(options.groups, left) : 0
    let rightNumber = options.groups ? getGroupNumber(options.groups, right) : 0

    let leftIndex = nodeIndexMap.get(left)!
    let rightIndex = nodeIndexMap.get(right)!

    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)

    let messageIds: MessageIds[] = []

    let firstUnorderedNodeDependentOnRight: undefined | T
    if (availableMessageIds.unexpectedDependencyOrder) {
      firstUnorderedNodeDependentOnRight = getFirstUnorderedNodeDependentOn({
        nodes: nodes as unknown as SortingNodeWithDependencies[],
        node: right as unknown as SortingNodeWithDependencies,
        nodesInCircularDependencies,
      }) as unknown as T
    }

    if (
      firstUnorderedNodeDependentOnRight ||
      leftIndex > rightIndex ||
      (left.isEslintDisabled &&
        leftIndex >= indexOfRightExcludingEslintDisabled)
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
      options.newlinesBetween &&
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
          newlinesBetweenValueGetter,
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
      newlinesBetweenValueGetter,
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

let getFirstUnorderedNodeDependentOn = <T extends SortingNodeWithDependencies>({
  nodesInCircularDependencies,
  nodes,
  node,
}: {
  nodesInCircularDependencies: Set<T>
  nodes: T[]
  node: T
}): undefined | T => {
  let nodesDependentOnNode = nodes.filter(
    currentlyOrderedNode =>
      !nodesInCircularDependencies.has(currentlyOrderedNode) &&
      isNodeDependentOnOtherNode(node, currentlyOrderedNode),
  )
  return nodesDependentOnNode.find(firstNodeDependentOnNode => {
    let currentIndexOfNode = nodes.indexOf(node)
    let currentIndexOfFirstNodeDependentOnNode = nodes.indexOf(
      firstNodeDependentOnNode,
    )
    return currentIndexOfFirstNodeDependentOnNode < currentIndexOfNode
  })
}
