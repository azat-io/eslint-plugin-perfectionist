import { minimatch } from 'minimatch'

import type { PartitionComment } from '../typings'

export let isPartitionComment = (
  partitionComment: PartitionComment,
  comment: string,
) =>
  (Array.isArray(partitionComment) &&
    partitionComment.some(pattern => minimatch(comment.trim(), pattern))) ||
  (typeof partitionComment === 'string' &&
    minimatch(comment.trim(), partitionComment)) ||
  partitionComment === true
