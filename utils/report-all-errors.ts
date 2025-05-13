import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { MakeFixesParameters } from './make-fixes'

import { computeNodesInCircularDependencies } from './compute-nodes-in-circular-dependencies'
import { getCommentAboveThatShouldExist } from './get-comment-above-that-should-exist'
import { isNodeDependentOnOtherNode } from './is-node-dependent-on-other-node'
import { getNewlinesBetweenErrors } from './get-newlines-between-errors'
import { createNodeIndexMap } from './create-node-index-map'
import { getGroupIndex } from './get-group-index'
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
    unexpectedGroupOrder: MessageIds
    missedCommentAbove?: MessageIds
    unexpectedOrder: MessageIds
  }
  options: {
    groups: GroupsOptions<string>
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
    let leftInfo = left
      ? {
          groupIndex: getGroupIndex(options.groups, left),
          index: nodeIndexMap.get(left)!,
        }
      : null

    let rightGroupIndex = getGroupIndex(options.groups, right)
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
      leftInfo &&
      (firstUnorderedNodeDependentOnRight ||
        leftInfo.index > rightIndex ||
        (left?.isEslintDisabled &&
          leftInfo.index >= indexOfRightExcludingEslintDisabled))
    ) {
      if (firstUnorderedNodeDependentOnRight) {
        messageIds.push(availableMessageIds.unexpectedDependencyOrder!)
      } else {
        messageIds.push(
          leftInfo.groupIndex === rightGroupIndex ||
            !availableMessageIds.unexpectedGroupOrder
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }
    }

    if (
      left &&
      options.newlinesBetween &&
      availableMessageIds.missedSpacingBetweenMembers &&
      availableMessageIds.extraSpacingBetweenMembers
    ) {
      messageIds = [
        ...messageIds,
        ...getNewlinesBetweenErrors({
          options: {
            ...options,
            newlinesBetween: options.newlinesBetween,
          },
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          leftGroupIndex: leftInfo!.groupIndex,
          newlinesBetweenValueGetter,
          rightGroupIndex,
          sourceCode,
          right,
          left,
        }),
      ]
    }

    let commentAboveMissing: undefined | string
    if (availableMessageIds.missedCommentAbove) {
      let commentAboveThatShouldExist = getCommentAboveThatShouldExist({
        leftGroupIndex: leftInfo?.groupIndex ?? null,
        sortingNode: right,
        rightGroupIndex,
        sourceCode,
        options,
      })
      if (commentAboveThatShouldExist && !commentAboveThatShouldExist.exists) {
        commentAboveMissing = commentAboveThatShouldExist.comment
        messageIds = [...messageIds, availableMessageIds.missedCommentAbove]
      }
    }

    reportErrors({
      sortedNodes: sortedNodesExcludingEslintDisabled,
      ignoreFirstNodeHighestBlockComment,
      firstUnorderedNodeDependentOnRight,
      newlinesBetweenValueGetter,
      commentAboveMissing,
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
