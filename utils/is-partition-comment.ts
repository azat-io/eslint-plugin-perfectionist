import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  RegexOption,
} from '../types/common-options'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { matches } from './matches'

interface IsPartitionCommentParameters {
  partitionByComment: PartitionByCommentOption
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

  let relevantPartitionByComment
  if (comment.type === AST_TOKEN_TYPES.Block && 'block' in partitionByComment) {
    relevantPartitionByComment = partitionByComment.block
  }
  if (comment.type === AST_TOKEN_TYPES.Line && 'line' in partitionByComment) {
    relevantPartitionByComment = partitionByComment.line
  }

  return (
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
  partitionByComment: RegexOption | boolean
  trimmedComment: string
}): boolean => {
  if (typeof partitionByComment === 'boolean') {
    return partitionByComment
  }
  return matches(trimmedComment, partitionByComment)
}
