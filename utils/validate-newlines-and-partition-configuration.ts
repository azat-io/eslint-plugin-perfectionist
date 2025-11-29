import type { CommonPartitionOptions } from '../types/common-partition-options'
import type { CommonGroupsOptions } from '../types/common-groups-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'

/** Options for validating newlines and partition configuration. */
type Options = Pick<
  CommonGroupsOptions<unknown, unknown>,
  'newlinesBetween' | 'groups'
> &
  Pick<CommonPartitionOptions, 'partitionByNewLine'>

/**
 * Validates that newline-related options don't conflict with each other.
 *
 * Ensures mutual exclusivity between partition-based and newline-insertion
 * approaches to managing spacing. These options conflict because:
 *
 * - `partitionByNewLine` preserves existing newlines as partition boundaries
 * - `newlinesBetween` actively manages newlines between groups.
 *
 * Using both would create ambiguous behavior where the plugin doesn't know
 * whether to preserve or modify existing newlines.
 *
 * @example
 *   // Valid: Using partitionByNewLine alone
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: true,
 *     newlinesBetween: 'ignore', // Must be 'ignore' with partitions
 *     groups: ['external', 'internal'],
 *   })
 *   // Preserves existing blank lines as boundaries
 *
 * @example
 *   // Invalid: Conflicting options
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: true,
 *     newlinesBetween: 1, // Conflicts with partitionByNewLine
 *     groups: ['react', 'external', 'internal'],
 *   })
 *   // Throws: The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together
 *
 * @example
 *   // Invalid: newlinesBetween in groups with partitions
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: true,
 *     newlinesBetween: 'ignore',
 *     groups: [
 *       'external',
 *       { newlinesBetween: 1 }, // Can't use with partitions
 *       'internal',
 *     ],
 *   })
 *   // Throws: 'newlinesBetween' objects can not be used in 'groups' alongside 'partitionByNewLine'
 *
 * @example
 *   // Valid: Using newlinesBetween without partitions
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: false,
 *     newlinesBetween: 1,
 *     groups: [
 *       'react',
 *       { newlinesBetween: 1 },
 *       'external',
 *       { newlinesBetween: 1 },
 *       'internal',
 *     ],
 *   })
 *   // Actively manages spacing between import groups
 *
 * @example
 *   // Real-world React imports configuration
 *   // Option 1: Preserve developer's spacing
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: true,
 *     newlinesBetween: 'ignore',
 *     groups: ['react', 'external', '@company', 'internal', 'relative'],
 *   })
 *
 *   // Option 2: Enforce consistent spacing
 *   validateNewlinesAndPartitionConfiguration({
 *     partitionByNewLine: false,
 *     newlinesBetween: 1,
 *     groups: ['react', 'external', '@company', 'internal', 'relative'],
 *   })
 *   // Choose one approach, not both
 *
 * @param options - Configuration options to validate.
 * @throws {Error} If partitionByNewLine and newlinesBetween conflict.
 */
export function validateNewlinesAndPartitionConfiguration({
  partitionByNewLine,
  newlinesBetween,
  groups,
}: Options): void {
  if (!partitionByNewLine) {
    return
  }
  if (newlinesBetween !== 'ignore') {
    throw new Error(
      "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
    )
  }
  let hasNewlinesBetweenGroup = groups.some(group =>
    isNewlinesBetweenOption(group),
  )
  if (hasNewlinesBetweenGroup) {
    throw new Error(
      "'newlinesBetween' objects can not be used in 'groups' alongside 'partitionByNewLine'",
    )
  }
}
