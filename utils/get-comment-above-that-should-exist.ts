import type { TSESLint } from '@typescript-eslint/utils'

import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { isCommentAboveOption } from './is-comment-above-option'
import { getCommentsBefore } from './get-comments-before'

interface GetCommentAboveMissingParameters<T extends SortingNode> {
  options: {
    customGroups?: DeprecatedCustomGroupsOption | CustomGroupsOption
    groups: GroupsOptions<string>
  }
  sourceCode: TSESLint.SourceCode
  leftGroupIndex: number | null
  rightGroupIndex: number
  sortingNode: T
}

export let getCommentAboveThatShouldExist = <T extends SortingNode>({
  rightGroupIndex,
  leftGroupIndex,
  sortingNode,
  sourceCode,
  options,
}: GetCommentAboveMissingParameters<T>): {
  comment: string
  exists: boolean
} | null => {
  if (leftGroupIndex !== null && leftGroupIndex >= rightGroupIndex) {
    return null
  }

  let groupAboveRight = options.groups[rightGroupIndex - 1]!
  if (!isCommentAboveOption(groupAboveRight)) {
    return null
  }

  let matchingCommentsAbove = getCommentsBefore({
    node: sortingNode.node,
    sourceCode,
  }).find(comment =>
    commentMatches(comment.value, groupAboveRight.commentAbove),
  )
  return {
    comment: groupAboveRight.commentAbove,
    exists: !!matchingCommentsAbove,
  }
}

let commentMatches = (comment: string, expected: string): boolean =>
  comment.toLowerCase().includes(expected.toLowerCase().trim())
