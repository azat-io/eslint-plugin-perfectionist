import type { TSESTree } from '@typescript-eslint/types'

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
  if (typeof partitionByComment === 'boolean') {
    return partitionByComment
  }
  if (typeof partitionByComment === 'string') {
    return matches(trimmedComment.trim(), partitionByComment)
  }
  if (Array.isArray(partitionByComment)) {
    return partitionByComment.some(pattern =>
      matches(trimmedComment.trim(), pattern),
    )
  }
  // TODO - implement block and line check
  throw new Error('not implemented')
}
