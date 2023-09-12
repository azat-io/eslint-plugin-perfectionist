import { minimatch } from 'minimatch'

import type { PartitionComment } from '../typings'

export let isPartitionComment = (
  partitionComment: PartitionComment,
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
