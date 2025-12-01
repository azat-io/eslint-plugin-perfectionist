import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { CommonGroupsOptions } from '../types/common-groups-options'
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

/**
 * Parameters for comprehensive error reporting across all sorting rules.
 *
 * @template MessageIds - Union of available message IDs for the rule.
 * @template T - Type of sorting node extending the base SortingNode.
 */
interface ReportAllErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  /**
   * Available message IDs for different types of violations.
   *
   * Each rule can customize these messages to provide context-specific error
   * descriptions. Not all message types are required - only provide those
   * relevant to the specific rule.
   *
   * @example
   *   // Class members rule with all message types
   *   availableMessageIds: {
   *   unexpectedOrder: 'unexpectedClassesOrder',
   *   unexpectedGroupOrder: 'unexpectedClassesGroupOrder',
   *   unexpectedDependencyOrder: 'unexpectedClassesDependencyOrder',
   *   missedSpacingBetweenMembers: 'missedSpacingBetweenClassMembers',
   *   extraSpacingBetweenMembers: 'extraSpacingBetweenClassMembers',
   *   missedCommentAbove: 'missedCommentAboveClassMember'
   *   }
   */
  availableMessageIds: {
    /** Message when required spacing between members is missing. */
    missedSpacingBetweenMembers?: MessageIds

    /** Message when there's extra spacing where it shouldn't be. */
    extraSpacingBetweenMembers?: MessageIds

    /** Message when a dependency order is violated. */
    unexpectedDependencyOrder?: MessageIds

    /** Message when elements are in wrong groups. */
    unexpectedGroupOrder: MessageIds

    /** Message when a required comment above a group is missing. */
    missedCommentAbove?: MessageIds

    /** Message for general ordering violations within a group. */
    unexpectedOrder: MessageIds
  }

  /**
   * Configuration options for sorting and grouping.
   *
   * Extends MakeFixesParameters options with groups configuration. Includes all
   * sorting preferences, partition settings, newlines configuration, and custom
   * group definitions.
   *
   * @example
   *   options: {
   *   type: 'alphabetical',
   *   order: 'asc',
   *   groups: ['static-property', 'property', 'constructor', 'method'],
   *   newlinesBetween: 1,
   *   partitionByComment: true
   *   }
   */
  options: Pick<CommonGroupsOptions<unknown, unknown, string>, 'groups'> &
    MakeFixesParameters<T>['options']

  /**
   * Function to get sorted nodes with or without ESLint-disabled nodes.
   *
   * This function is called twice by reportAllErrors:
   *
   * 1. With `false` to get all nodes for position mapping
   * 2. With `true` to get nodes excluding disabled ones for error checking.
   *
   * This dual-call pattern ensures that ESLint-disabled nodes maintain their
   * positions while not being considered for ordering violations.
   *
   * @param ignoreEslintDisabledNodes - Whether to exclude ESLint-disabled
   *   nodes.
   * @returns Array of sorted nodes.
   */
  sortNodesExcludingEslintDisabled(ignoreEslintDisabledNodes: boolean): T[]

  /**
   * Optional function to determine newlines between specific node pairs.
   *
   * Allows rules to customize spacing logic for special cases, such as overload
   * signatures in TypeScript or getter/setter pairs.
   *
   * @example
   *   // Classes: Keep overload signatures together
   *   newlinesBetweenValueGetter: ({
   *     left,
   *     right,
   *     computedNewlinesBetween,
   *   }) => {
   *     if (
   *       left.overloadSignaturesGroupId === right.overloadSignaturesGroupId
   *     ) {
   *       return 0 // No newlines between overloads
   *     }
   *     return computedNewlinesBetween
   *   }
   *
   * @param params - Context for determining newlines.
   * @returns Number of required newlines or 'ignore'.
   */
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>

  /**
   * ESLint rule context for reporting errors.
   *
   * Used to access rule configuration, report violations, and provide fixes.
   * The context includes the rule ID, options, settings, and methods for
   * interacting with ESLint.
   */
  context: TSESLint.RuleContext<MessageIds, unknown[]>

  /**
   * Whether to ignore the highest block comment above the first node.
   *
   * When true, preserves file-level documentation comments at the top of sorted
   * blocks. This is useful for maintaining copyright headers, file
   * descriptions, or other important documentation.
   */
  ignoreFirstNodeHighestBlockComment?: boolean

  /**
   * ESLint source code object for text manipulation.
   *
   * Provides methods to get text content, find tokens, and analyze the
   * structure of the source code. Essential for generating fixes and
   * determining node positions.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * Array of all nodes to check for ordering violations.
   *
   * These are the nodes in their current order in the source code. The function
   * will compare this order against the sorted order to identify and report all
   * violations.
   */
  nodes: T[]
}

/**
 * Detects and reports all sorting violations in a comprehensive manner.
 *
 * Performs a complete analysis of sorting errors including:
 *
 * - Order violations (elements in wrong positions)
 * - Group order violations (elements in wrong groups)
 * - Dependency violations (dependent elements before their dependencies)
 * - Spacing issues (missing or extra newlines between groups)
 * - Missing comment separators above groups.
 *
 * The function uses pairwise comparison to check each adjacent pair of nodes
 * and accumulates all applicable error messages for each violation.
 *
 * @example
 *   // Import statements with violations
 *   import { useState } from 'react' // Should be after React import
 *   import React from 'react' // Group order violation
 *   import type { User } from './types' // Missing newline between groups
 *
 * @example
 *   // Object properties with dependency violation
 *   const config = {
 *     apiUrl: process.env.API_URL,
 *     baseUrl: this.apiUrl + '/v1', // Depends on apiUrl
 *     timeout: 5000,
 *     headers: {
 *       Authorization: this.token, // Should be after token definition
 *     },
 *     token: getAuthToken(),
 *   }
 *
 * @template MessageIds - Union of available message IDs.
 * @template T - Type of sorting node.
 * @param params - Parameters for error detection and reporting.
 */
export function reportAllErrors<
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
}: ReportAllErrorsParameters<MessageIds, T>): void {
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

/**
 * Finds the first node that depends on the given node but appears before it.
 *
 * Detects dependency violations where a dependent element appears before its
 * dependency in the current order. This is crucial for maintaining logical
 * ordering in code where some elements reference others.
 *
 * Nodes in circular dependencies are excluded from this check as they cannot be
 * properly ordered.
 *
 * @example
 *   // TypeScript interface extending another
 *   interface AdminUser extends User {
 *     // This depends on User
 *     permissions: string[]
 *   }
 *   interface User {
 *     // But User appears after AdminUser
 *     id: string
 *     name: string
 *   }
 *   // Returns: AdminUser node (appears before its dependency).
 *
 * @template T - Type of sorting node with dependencies.
 * @param params - Parameters for finding dependent nodes.
 * @param params.nodesInCircularDependencies - Set of nodes in circular
 *   dependencies.
 * @param params.nodes - All nodes in current order.
 * @param params.node - The node to check for dependents.
 * @returns First dependent node appearing before its dependency, or undefined.
 */
function getFirstUnorderedNodeDependentOn<
  T extends SortingNodeWithDependencies,
>({
  nodesInCircularDependencies,
  nodes,
  node,
}: {
  nodesInCircularDependencies: Set<T>
  nodes: T[]
  node: T
}): undefined | T {
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
