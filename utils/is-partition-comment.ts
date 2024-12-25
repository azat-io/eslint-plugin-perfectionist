import type { TSESTree } from '@typescript-eslint/types'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { matches } from './matches'

interface IsPartitionCommentParameters {
  partitionByComment: string[] | boolean | string
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

  return isTrimmedCommentPartitionComment({
    partitionByComment,
    trimmedComment,
  })
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
