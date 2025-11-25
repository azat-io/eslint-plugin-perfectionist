import type { TSESLint } from '@typescript-eslint/utils'

import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { NewlinesBetweenValueGetter } from './get-newlines-between-errors'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'
import { getGroupIndex } from './get-group-index'
import { getNodeRange } from './get-node-range'

/**
 * Parameters for generating newlines-between fixes.
 *
 * @template T - Type of sorting node extending the base SortingNode.
 */
interface MakeNewlinesBetweenFixesParameters<T extends SortingNode> {
  /** Configuration options for groups and newlines. */
  options: {
    newlinesBetween: NewlinesBetweenOption

    /** Required newlines configuration between groups. */

    /** Optional custom groups configuration. */
    customGroups: CustomGroupsOption

    /** Groups configuration defining available groups and their order. */
    groups: GroupsOptions<string>
  }

  /**
   * Optional function to customize newlines between specific nodes. Allows
   * overriding the default newlines behavior for specific cases.
   */
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>

  /** ESLint source code object for accessing text and locations. */
  sourceCode: TSESLint.SourceCode

  /** ESLint fixer object for creating fix operations. */
  fixer: TSESLint.RuleFixer

  /** Array of nodes in their sorted order. */
  sortedNodes: T[]

  /** Array of nodes in their original order. */
  nodes: T[]
}

/**
 * Generates fixes for adjusting newlines between groups of sorted elements.
 *
 * Processes pairs of adjacent nodes to ensure the correct number of newlines
 * between them based on their group membership and configuration. The
 * function:
 *
 * - Skips nodes in different partitions (they're sorted independently)
 * - Skips cases where group order would be violated
 * - Respects 'ignore' settings that preserve existing spacing
 * - Calculates required newlines based on group configuration
 * - Applies custom newlines getter if provided.
 *
 * @example
 *   // Configuration with newlines between groups
 *   const options = {
 *     groups: ['imports', 'types', 'functions'],
 *     newlinesBetween: 1, // 1 newline between groups
 *   }
 *
 *   // Original: imports and types with no separation
 *   // After fix: adds 1 blank line between import and type groups
 *
 * @example
 *   // Custom newlines getter
 *   const newlinesBetweenValueGetter = ({
 *     left,
 *     right,
 *     computedNewlinesBetween,
 *   }) => {
 *     // Add extra newline before main function
 *     if (right.name === 'main') return computedNewlinesBetween + 1
 *     return computedNewlinesBetween
 *   }
 *
 * @template T - Type of sorting node.
 * @param params - Parameters for generating newlines fixes.
 * @returns Array of ESLint fix operations to adjust spacing.
 */
export function makeNewlinesBetweenFixes<T extends SortingNode>({
  newlinesBetweenValueGetter,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}: MakeNewlinesBetweenFixesParameters<T>): TSESLint.RuleFix[] {
  let fixes: TSESLint.RuleFix[] = []

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let sortingNode = nodes.at(i)!
    let nextSortingNode = nodes.at(i + 1)!
    let sortedSortingNode = sortedNodes.at(i)!
    let nextSortedSortingNode = sortedNodes.at(i + 1)!

    if (sortedSortingNode.partitionId !== nextSortedSortingNode.partitionId) {
      continue
    }

    let nodeGroupIndex = getGroupIndex(options.groups, sortedSortingNode)
    let nextNodeGroupIndex = getGroupIndex(
      options.groups,
      nextSortedSortingNode,
    )
    if (nodeGroupIndex > nextNodeGroupIndex) {
      continue
    }

    let newlinesBetween = getNewlinesBetweenOption({
      nextNodeGroupIndex,
      nodeGroupIndex,
      options,
    })
    newlinesBetween =
      newlinesBetweenValueGetter?.({
        computedNewlinesBetween: newlinesBetween,
        right: nextSortedSortingNode,
        left: sortedSortingNode,
      }) ?? newlinesBetween

    if (newlinesBetween === 'ignore') {
      continue
    }

    let currentNodeRange = getNodeRange({
      node: sortingNode.node,
      sourceCode,
    })
    let nextNodeRangeStart = getNodeRange({
      node: nextSortingNode.node,
      sourceCode,
    }).at(0)!

    let linesBetweenMembers = getLinesBetween(
      sourceCode,
      sortingNode,
      nextSortingNode,
    )
    if (linesBetweenMembers === newlinesBetween) {
      continue
    }

    let rangeToReplace: [number, number] = [
      currentNodeRange.at(1)!,
      nextNodeRangeStart,
    ]
    let textBetweenNodes = sourceCode.text.slice(
      currentNodeRange.at(1),
      nextNodeRangeStart,
    )

    let rangeReplacement = computeRangeReplacement({
      isOnSameLine:
        sortingNode.node.loc.end.line === nextSortingNode.node.loc.start.line,
      textBetweenNodes,
      newlinesBetween,
    })!

    fixes.push(fixer.replaceTextRange(rangeToReplace, rangeReplacement))
  }

  return fixes
}

/**
 * Computes the replacement text for adjusting newlines between nodes.
 *
 * Handles the logic of adding or removing newlines while preserving necessary
 * content like comments and semicolons. Special handling for:
 *
 * - Removing excessive newlines when fewer are needed
 * - Adding newlines when more are needed
 * - Preserving inline placement when nodes are on the same line.
 *
 * @param params - Parameters for computing replacement.
 * @param params.textBetweenNodes - Original text between the two nodes.
 * @param params.newlinesBetween - Number of newlines required (0 or more).
 * @param params.isOnSameLine - Whether nodes are currently on the same line.
 * @returns Replacement text with correct newlines, or undefined if no change
 *   needed.
 */
function computeRangeReplacement({
  textBetweenNodes,
  newlinesBetween,
  isOnSameLine,
}: {
  textBetweenNodes: string
  newlinesBetween: number
  isOnSameLine: boolean
}): undefined | string {
  let textBetweenNodesWithoutInvalidNewlines =
    getStringWithoutInvalidNewlines(textBetweenNodes)

  if (newlinesBetween === 0) {
    return textBetweenNodesWithoutInvalidNewlines
  }

  let rangeReplacement = textBetweenNodesWithoutInvalidNewlines
  for (let index = 0; index < newlinesBetween; index++) {
    rangeReplacement = addNewlineBeforeFirstNewline(rangeReplacement)
  }
  if (!isOnSameLine) {
    return rangeReplacement
  }
  return addNewlineBeforeFirstNewline(rangeReplacement)
}

/**
 * Adds a newline before the first existing newline or at the end of string.
 *
 * Used to incrementally add newlines while preserving existing content. If no
 * newline exists, appends one at the end. Otherwise, inserts before the first
 * newline to maintain proper spacing.
 *
 * @param value - String to add a newline to.
 * @returns String with an additional newline.
 */
function addNewlineBeforeFirstNewline(value: string): string {
  let firstNewlineIndex = value.indexOf('\n')
  if (firstNewlineIndex === -1) {
    return `${value}\n`
  }
  return `${value.slice(0, firstNewlineIndex)}\n${value.slice(firstNewlineIndex)}`
}

/**
 * Removes excessive newlines from a string.
 *
 * Normalizes spacing by collapsing multiple consecutive newlines into single
 * newlines and removing empty lines that contain only whitespace.
 *
 * @param value - String potentially containing excessive newlines.
 * @returns String with normalized newlines.
 */
function getStringWithoutInvalidNewlines(value: string): string {
  return value.replaceAll(/\n\s*\n/gu, '\n').replaceAll(/\n+/gu, '\n')
}
