import type { TSESTree } from '@typescript-eslint/types'

import { minimatch } from 'minimatch'

export let isPartitionComment = (
  partitionComment: string[] | boolean | string,
  comment: string,
) =>
  (Array.isArray(partitionComment) &&
    partitionComment.some(pattern =>
      minimatch(comment.trim(), pattern, {
        nocomment: true,
      }),
    )) ||
  (typeof partitionComment === 'string' &&
    minimatch(comment.trim(), partitionComment, {
      nocomment: true,
    })) ||
  partitionComment === true

export let hasPartitionComment = (
  partitionComment: string[] | boolean | string,
  comments: TSESTree.Comment[],
): boolean =>
  comments.some(comment => isPartitionComment(partitionComment, comment.value))
