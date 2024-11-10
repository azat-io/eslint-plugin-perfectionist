import type { TSESTree } from '@typescript-eslint/types'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { matches } from './matches'

export let isPartitionComment = (
  partitionComment: string[] | boolean | string,
  comment: string,
) => {
  if (getEslintDisabledRules(comment)) {
    return false
  }
  return (
    (Array.isArray(partitionComment) &&
      partitionComment.some(pattern => matches(comment.trim(), pattern))) ||
    (typeof partitionComment === 'string' &&
      matches(comment.trim(), partitionComment)) ||
    partitionComment === true
  )
}

export let hasPartitionComment = (
  partitionComment: string[] | boolean | string,
  comments: TSESTree.Comment[],
): boolean =>
  comments.some(comment => isPartitionComment(partitionComment, comment.value))
