import type { TSESTree } from '@typescript-eslint/types'

import type { PartitionByCommentOption } from '../types/common-options'

import { isPartitionComment } from './is-partition-comment'

interface HasPartitionCommentParameters {
  partitionByComment: PartitionByCommentOption
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
