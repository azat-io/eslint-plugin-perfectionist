import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { getCommentAboveThatShouldExist } from './get-comment-above-that-should-exist'
import { isCommentAboveOption } from './is-comment-above-option'
import { getCommentsBefore } from './get-comments-before'
import { getGroupIndex } from './get-group-index'

interface MakeCommentAboveFixesParameters {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    groups: GroupsOptions<string>
  }
  sourceCode: TSESLint.SourceCode
  sortedNodes: SortingNode[]
  fixer: TSESLint.RuleFixer
}

export function makeCommentAboveFixes({
  sortedNodes,
  sourceCode,
  options,
  fixer,
}: MakeCommentAboveFixesParameters): TSESLint.RuleFix[] {
  let allAutoAddedComments = new Set(
    options.groups
      .filter(group => isCommentAboveOption(group))
      .map(({ commentAbove }) => commentAbove),
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
