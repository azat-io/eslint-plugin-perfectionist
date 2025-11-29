import type { RegexOption } from './common-options'

/**
 * Configuration for partition comments that create independent sorting
 * sections.
 *
 * Partitions divide code into separate blocks that are sorted independently,
 * preventing elements from being moved across partition boundaries. This
 * preserves logical groupings and intentional code organization.
 *
 * @example
 *   // Boolean: Enable/disable partition comments
 *   const partitionOption: PartitionByCommentOption = true
 *
 * @example
 *   // String pattern: Comments matching this pattern create partitions
 *   const partitionOption: PartitionByCommentOption = 'Section:'
 *
 * @example
 *   // Array of patterns: Any matching pattern creates a partition
 *   const partitionOption: PartitionByCommentOption = ['Section:', 'Part:']
 *
 * @example
 *   // Object: Different patterns for block and line comments
 *   const partitionOption: PartitionByCommentOption = {
 *     block: ['Section:', 'Chapter:'],
 *     line: 'Part:',
 *   }
 */
export type PartitionByCommentOption =
  | {
      /**
       * Pattern(s) for block comments that create partitions. Block comments
       * are multi-line comments.
       */
      block?: RegexOption | boolean

      /**
       * Pattern(s) for line comments that create partitions. Line comments are
       * single-line comments (// ...).
       */
      line?: RegexOption | boolean
    }
  | RegexOption
  | boolean

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
