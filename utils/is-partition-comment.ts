import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { matches } from './matches'

interface IsPartitionCommentParameters {
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  comment: TSESTree.Comment
}

export let isPartitionComment = ({
  partitionByComment,
  comment,
}: IsPartitionCommentParameters): boolean => {
  if (getEslintDisabledRules(comment.value) || !partitionByComment) {
    return false
  }

  let trimmedComment = comment.value.trim()

  if (
    Array.isArray(partitionByComment) ||
    typeof partitionByComment === 'boolean' ||
    typeof partitionByComment === 'string'
  ) {
    return isTrimmedCommentPartitionComment({
      partitionByComment,
      trimmedComment,
    })
  }

  let relevantPartitionByComment =
    comment.type === AST_TOKEN_TYPES.Block
      ? partitionByComment.block
      : partitionByComment.line

  return (
    // eslint-disable-next-line no-undefined
    relevantPartitionByComment !== undefined &&
    isTrimmedCommentPartitionComment({
      partitionByComment: relevantPartitionByComment,
      trimmedComment,
    })
  )
}

let isTrimmedCommentPartitionComment = ({
  partitionByComment,
  trimmedComment,
}: {
  partitionByComment: string[] | boolean | string
  trimmedComment: string
}): boolean => {
  if (typeof partitionByComment === 'boolean') {
    return partitionByComment
  }
  if (typeof partitionByComment === 'string') {
    return matches(trimmedComment.trim(), partitionByComment)
  }
  return partitionByComment.some(pattern =>
    matches(trimmedComment.trim(), pattern),
  )
}
