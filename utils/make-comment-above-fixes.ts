import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { CustomGroupsOption, GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { getCommentAboveThatShouldExist } from './get-comment-above-that-should-exist'
import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { getCommentsBefore } from './get-comments-before'
import { getGroupIndex } from './get-group-index'

/** Parameters for generating comment-above fixes. */
interface MakeCommentAboveFixesParameters {
  /** Configuration options containing groups and custom groups. */
  options: {
    /** Optional custom groups configuration. */
    customGroups: CustomGroupsOption

    /** Groups configuration that may include commentAbove settings. */
    groups: GroupsOptions<string>
  }

  /** ESLint source code object for accessing comments and tokens. */
  sourceCode: TSESLint.SourceCode

  /** Sorted array of nodes to process for comment fixes. */
  sortedNodes: SortingNode[]

  /** ESLint fixer object for creating fix operations. */
  fixer: TSESLint.RuleFixer
}

/**
 * Generates fixes for adding or removing comment separators above groups.
 *
 * Processes sorted nodes to ensure that comment separators defined in the
 * groups configuration are properly placed. This includes:
 *
 * - Adding missing comment separators above groups
 * - Removing auto-generated comments that are no longer needed
 * - Ensuring comments are in the correct position after sorting.
 *
 * The function handles the first node specially (checking if it needs a
 * comment) and then processes pairs of adjacent nodes to determine comment
 * placement.
 *
 * @example
 *   // Configuration with commentAbove
 *   const groups = ['imports', { commentAbove: 'Components' }, 'components']
 *
 *   // Will add '// Components' comment above the components group
 *   // Will remove any misplaced auto-generated comments
 *
 * @param params - Parameters for generating fixes.
 * @returns Array of ESLint fix operations to apply.
 */
export function makeCommentAboveFixes({
  sortedNodes,
  sourceCode,
  options,
  fixer,
}: MakeCommentAboveFixesParameters): TSESLint.RuleFix[] {
  let allAutoAddedComments = new Set(
    options.groups
      .filter(group => isGroupWithOverridesOption(group))
      .map(({ commentAbove }) => commentAbove)
      .filter(comment => comment !== undefined),
  )

  let fixes: TSESLint.RuleFix[] = []

  let firstNodeFixes = makeCommentAboveFix({
    nextSortedSortingNode: sortedNodes[0]!,
    sortedSortingNode: null,
    allAutoAddedComments,
    sourceCode,
    options,
    fixer,
  })
  fixes.push(...firstNodeFixes)

  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let sortedSortingNode = sortedNodes.at(i)!
    let nextSortedSortingNode = sortedNodes.at(i + 1)!

    let nodeFixes = makeCommentAboveFix({
      nextSortedSortingNode,
      allAutoAddedComments,
      sortedSortingNode,
      sourceCode,
      options,
      fixer,
    })
    fixes.push(...nodeFixes)
  }

  return fixes
}

/**
 * Creates fixes for comment placement between two adjacent nodes.
 *
 * Determines whether a comment separator should exist between two nodes based
 * on their group indices and configuration. Handles:
 *
 * - Adding a new comment if required but missing
 * - Removing outdated auto-generated comments
 * - Preserving manually added comments.
 *
 * The function checks if the next node should have a comment above it based on
 * the groups configuration, then ensures the comment state matches the expected
 * state.
 *
 * @param params - Parameters for creating fixes.
 * @param params.sortedSortingNode - Previous node in sorted order (null for
 *   first node).
 * @param params.nextSortedSortingNode - Current node to potentially add comment
 *   above.
 * @param params.allAutoAddedComments - Set of all auto-generated comment texts.
 * @param params.sourceCode - ESLint source code object.
 * @param params.options - Groups and configuration options.
 * @param params.fixer - ESLint fixer for creating fixes.
 * @returns Array of fixes to add/remove comments.
 */
function makeCommentAboveFix({
  nextSortedSortingNode,
  allAutoAddedComments,
  sortedSortingNode,
  sourceCode,
  options,
  fixer,
}: {
  sortedSortingNode: SortingNode | null
  nextSortedSortingNode: SortingNode
  allAutoAddedComments: Set<string>
} & Pick<
  MakeCommentAboveFixesParameters,
  'sourceCode' | 'options' | 'fixer'
>): TSESLint.RuleFix[] {
  let leftGroupIndex = sortedSortingNode
    ? getGroupIndex(options.groups, sortedSortingNode)
    : -1
  let rightGroupIndex = getGroupIndex(options.groups, nextSortedSortingNode)

  let commentAboveThatShouldExist = getCommentAboveThatShouldExist({
    options: {
      ...options,
      groups: options.groups,
    },
    sortingNode: nextSortedSortingNode,
    rightGroupIndex,
    leftGroupIndex,
    sourceCode,
  })

  let commentsBefore = getCommentsBefore({
    node: nextSortedSortingNode.node,
    sourceCode,
  })
  let autoAddedCommentsAboveToRemove = commentsBefore
    .filter(
      comment =>
        !commentAboveThatShouldExist?.comment ||
        comment.value.slice(1) !== commentAboveThatShouldExist.comment,
    )
    .filter(
      comment =>
        comment.type === 'Line' &&
        allAutoAddedComments.has(comment.value.slice(1)),
    )

  let fixes: TSESLint.RuleFix[] = []

  for (let autoAddedCommentAboveToRemove of autoAddedCommentsAboveToRemove) {
    let nextToken = sourceCode.getTokenAfter(autoAddedCommentAboveToRemove)!
    fixes.push(
      fixer.removeRange([
        autoAddedCommentAboveToRemove.range[0],
        nextToken.range[0],
      ]),
    )
  }

  if (commentAboveThatShouldExist && !commentAboveThatShouldExist.exists) {
    let nodeToPutCommentBefore: TSESTree.Comment | TSESTree.Node
    let isFirstToken = !sourceCode.getTokenBefore(nextSortedSortingNode.node)
    if (isFirstToken || !commentsBefore[0]) {
      nodeToPutCommentBefore = nextSortedSortingNode.node
    } else {
      ;[nodeToPutCommentBefore] = commentsBefore
    }
    fixes.push(
      fixer.insertTextBeforeRange(
        nodeToPutCommentBefore.range,
        `// ${commentAboveThatShouldExist.comment}\n`,
      ),
    )
  }

  return fixes
}
