import type { TSESLint } from '@typescript-eslint/utils'

import type {
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-groups-options'
import type { SortingNode } from '../types/sorting-node'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { getCommentsBefore } from './get-comments-before'

/**
 * Parameters for checking if a required comment above a node exists.
 *
 * @template T - Type of the sorting node.
 */
interface GetCommentAboveMissingParameters<T extends SortingNode> {
  /** Configuration options for grouping. */
  options: {
    /** Optional custom groups configuration. */
    customGroups: CustomGroupsOption

    /** Groups configuration that may include comment requirements. */
    groups: GroupsOptions
  }

  /** ESLint source code object for accessing comments. */
  sourceCode: TSESLint.SourceCode

  /**
   * Index of the group on the left side (previous element). Null if there is no
   * previous element.
   */
  leftGroupIndex: number | null

  /** Index of the group on the right side (current element). */
  rightGroupIndex: number

  /** The sorting node to check for required comments above. */
  sortingNode: T
}

/**
 * Determines if a comment should exist above a node when transitioning between
 * groups.
 *
 * Checks if the group configuration requires a comment above nodes when they
 * are the first element of their group following a different group. This is
 * used to enforce comment separators between different sections of sorted
 * code.
 *
 * The function returns null if:
 *
 * - The left and right elements are in the same or reversed group order
 * - The group configuration doesn't require a comment above.
 *
 * @example
 *   const result = getCommentAboveThatShouldExist({
 *     options: {
 *       groups: [
 *         'external',
 *         { commentAbove: 'Internal imports' },
 *         'internal',
 *       ],
 *     },
 *     leftGroupIndex: 0, // 'external' group
 *     rightGroupIndex: 2, // 'internal' group
 *     sortingNode: internalImportNode,
 *     sourceCode,
 *   })
 *   // Returns: { comment: 'Internal imports', exists: false }
 *
 * @template T - Type of the sorting node.
 * @param params - Parameters for checking comment requirements.
 * @param params.options - Configuration with groups that may require comments.
 * @param params.leftGroupIndex - Index of the previous element's group.
 * @param params.rightGroupIndex - Index of the current element's group.
 * @param params.sortingNode - Node to check for required comments.
 * @param params.sourceCode - ESLint source code for accessing comments.
 * @returns Object with required comment text and existence status, or null if
 *   no comment required.
 */
export function getCommentAboveThatShouldExist<T extends SortingNode>({
  rightGroupIndex,
  leftGroupIndex,
  sortingNode,
  sourceCode,
  options,
}: GetCommentAboveMissingParameters<T>): {
  comment: string
  exists: boolean
} | null {
  if (leftGroupIndex !== null && leftGroupIndex >= rightGroupIndex) {
    return null
  }

  let rightGroup = options.groups[rightGroupIndex]
  if (!rightGroup || !isGroupWithOverridesOption(rightGroup)) {
    return null
  }
  let rightGroupCommentAbove = rightGroup.commentAbove

  if (!rightGroupCommentAbove) {
    return null
  }

  let matchingCommentsAbove = getCommentsBefore({
    node: sortingNode.node,
    sourceCode,
  }).find(comment => commentMatches(comment.value, rightGroupCommentAbove))
  return {
    comment: rightGroupCommentAbove,
    exists: !!matchingCommentsAbove,
  }
}

function commentMatches(comment: string, expected: string): boolean {
  return comment.toLowerCase().includes(expected.toLowerCase().trim())
}
