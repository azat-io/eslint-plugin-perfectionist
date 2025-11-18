import type { PartitionByCommentOption } from './common-options'

export interface CommonPartitionOptions {
  /**
   * Partition nodes by comment delimiters. Nodes separated by specific comments
   * are sorted independently.
   */
  partitionByComment: PartitionByCommentOption

  /**
   * Whether to partition nodes by newlines. When true, nodes separated by empty
   * lines are sorted independently.
   */
  partitionByNewLine: boolean
}
