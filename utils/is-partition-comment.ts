import type { TSESTree } from '@typescript-eslint/types'

import { matches } from './matches'

export let isPartitionComment = (
  partitionComment: string[] | boolean | string,
  comment: string,
) =>
  (Array.isArray(partitionComment) &&
    partitionComment.some(pattern => matches(comment.trim(), pattern))) ||
  (typeof partitionComment === 'string' &&
    matches(comment.trim(), partitionComment)) ||
  partitionComment === true

export let hasPartitionComment = (
  partitionComment: string[] | boolean | string,
  comments: TSESTree.Comment[],
): boolean =>
  comments.some(comment => isPartitionComment(partitionComment, comment.value))
