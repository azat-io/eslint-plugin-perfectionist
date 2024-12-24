import type { TSESTree } from '@typescript-eslint/types'

import { isPartitionComment } from './is-partition-comment'

interface HasPartitionCommentParameters {
  partitionByComment:
    | {
        block?: string[] | boolean | string
        line?: string[] | boolean | string
      }
    | string[]
    | boolean
    | string
  comments: TSESTree.Comment[]
}

export let hasPartitionComment = ({
  partitionByComment,
  comments,
}: HasPartitionCommentParameters): boolean =>
  comments.some(comment =>
    isPartitionComment({
      partitionByComment,
      comment,
    }),
  )
