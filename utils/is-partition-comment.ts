import type { TSESTree } from '@typescript-eslint/types'

import { matches } from './matches'

export let isPartitionComment = (
  partitionComment: string[] | boolean | string,
  comment: string,
  matcher: 'minimatch' | 'regex',
) =>
  (Array.isArray(partitionComment) &&
    partitionComment.some(pattern =>
      matches(comment.trim(), pattern, matcher),
    )) ||
  (typeof partitionComment === 'string' &&
    matches(comment.trim(), partitionComment, matcher)) ||
  partitionComment === true

export let hasPartitionComment = (
  partitionComment: string[] | boolean | string,
  comments: TSESTree.Comment[],
  matcher: 'minimatch' | 'regex',
): boolean =>
  comments.some(comment =>
    isPartitionComment(partitionComment, comment.value, matcher),
  )
