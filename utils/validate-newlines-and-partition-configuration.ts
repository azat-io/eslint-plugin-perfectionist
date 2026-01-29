import type {
  NewlinesInsideOption,
  CommonGroupsOptions,
} from '../types/common-groups-options'
import type { CommonPartitionOptions } from '../types/common-partition-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { isNewlinesBetweenOption } from './is-newlines-between-option'

/**
 * Options for validating newlines and partition configuration.
 */
type Options = Pick<
  CommonGroupsOptions<string, unknown, unknown>,
  'newlinesBetween' | 'newlinesInside' | 'customGroups' | 'groups'
> &
  Pick<CommonPartitionOptions, 'partitionByNewLine'>

const NEWLINES_INSIDE_ERROR_MESSAGE =
  "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together"

const NEWLINES_BETWEEN_ERROR_MESSAGE =
  "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together"

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
 *
 * ```ts
 * // Valid: Using partitionByNewLine alone
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: true,
 *   newlinesBetween: 'ignore', // Must be 'ignore' with partitions
 *   groups: ['external', 'internal'],
 * })
 * // Preserves existing blank lines as boundaries
 * ```
 *
 * @example
 *
 * ```ts
 * // Invalid: Conflicting options
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: true,
 *   newlinesBetween: 1, // Conflicts with partitionByNewLine
 *   groups: ['react', 'external', 'internal'],
 * })
 * // Throws: The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together
 * ```
 *
 * @example
 *
 * ```ts
 * // Invalid: newlinesBetween in groups with partitions
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: true,
 *   newlinesBetween: 'ignore',
 *   groups: [
 *     'external',
 *     { newlinesBetween: 1 }, // Can't use with partitions
 *     'internal',
 *   ],
 * })
 * // Throws: 'newlinesBetween' objects can not be used in 'groups' alongside 'partitionByNewLine'
 * ```
 *
 * @example
 *
 * ```ts
 * // Valid: Using newlinesBetween without partitions
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: false,
 *   newlinesBetween: 1,
 *   groups: [
 *     'react',
 *     { newlinesBetween: 1 },
 *     'external',
 *     { newlinesBetween: 1 },
 *     'internal',
 *   ],
 * })
 * // Actively manages spacing between import groups
 * ```
 *
 * @example
 *
 * ```ts
 * // Real-world React imports configuration
 * // Option 1: Preserve developer's spacing
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: true,
 *   newlinesBetween: 'ignore',
 *   groups: ['react', 'external', '@company', 'internal', 'relative'],
 * })
 *
 * // Option 2: Enforce consistent spacing
 * validateNewlinesAndPartitionConfiguration({
 *   partitionByNewLine: false,
 *   newlinesBetween: 1,
 *   groups: ['react', 'external', '@company', 'internal', 'relative'],
 * })
 * // Choose one approach, not both
 * ```
 *
 * @param options - Configuration options to validate.
 * @throws {Error} If partitionByNewLine and newlinesBetween conflict.
 */
export function validateNewlinesAndPartitionConfiguration({
  partitionByNewLine,
  newlinesBetween,
  newlinesInside,
  customGroups,
  groups,
}: Options): void {
  if (!partitionByNewLine) {
    return
  }

  validateNewlinesBetweenConfiguration({
    newlinesBetween,
    groups,
  })
  validateNewlinesInsideConfiguration({
    newlinesInside,
    customGroups,
    groups,
  })
}

function validateNewlinesInsideConfiguration({
  newlinesInside,
  customGroups,
  groups,
}: Pick<
  CommonGroupsOptions<string, unknown, unknown>,
  'newlinesInside' | 'customGroups' | 'groups'
>): void {
  switch (newlinesInside) {
    case 'newlinesBetween':
    case 'ignore':
      break
    default:
      throw new Error(NEWLINES_INSIDE_ERROR_MESSAGE)
  }

  validateGroups()
  validateCustomGroups()

  function validateCustomGroups(): void {
    for (let customGroup of customGroups) {
      throwErrorIfNeeded(customGroup.newlinesInside)
    }
  }

  function validateGroups(): void {
    for (let group of groups) {
      if (!isGroupWithOverridesOption(group)) {
        continue
      }
      throwErrorIfNeeded(group.newlinesInside)
    }
  }

  function throwErrorIfNeeded(
    newlinesInsideOptions: NewlinesInsideOption | undefined,
  ): void {
    switch (newlinesInsideOptions) {
      case undefined:
      case 'ignore':
        return
      default:
        throw new Error(NEWLINES_INSIDE_ERROR_MESSAGE)
    }
  }
}

function validateNewlinesBetweenConfiguration({
  newlinesBetween,
  groups,
}: Pick<
  CommonGroupsOptions<string, unknown, unknown>,
  'newlinesBetween' | 'groups'
>): void {
  if (newlinesBetween !== 'ignore') {
    throw new Error(NEWLINES_BETWEEN_ERROR_MESSAGE)
  }

  let hasInvalidNewlinesBetweenGroup = groups.some(
    group =>
      isNewlinesBetweenOption(group) && group.newlinesBetween !== 'ignore',
  )
  if (hasInvalidNewlinesBetweenGroup) {
    throw new Error(NEWLINES_BETWEEN_ERROR_MESSAGE)
  }
}
