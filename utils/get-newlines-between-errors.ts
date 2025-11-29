import type { TSESLint } from '@typescript-eslint/utils'

import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from './get-newlines-between-option'
import { getLinesBetween } from './get-lines-between'

/**
 * Function type for customizing newlines between specific nodes.
 *
 * Allows overriding the computed newlines requirement based on the specific
 * nodes being compared. Can return 'ignore' to skip newline checking or a
 * number to specify exact newlines required.
 *
 * @template T - Type of the sorting node.
 * @param props - Properties for computing newlines.
 * @param props.computedNewlinesBetween - Default computed newlines requirement.
 * @param props.left - Left/first node.
 * @param props.right - Right/second node.
 * @returns Number of required newlines or 'ignore' to skip checking.
 */
export type NewlinesBetweenValueGetter<T extends SortingNode> = (props: {
  computedNewlinesBetween: 'ignore' | number
  right: T
  left: T
}) => 'ignore' | number

/**
 * Parameters for checking newlines between nodes and generating errors.
 *
 * @template MessageIds - Type of error message identifiers.
 * @template T - Type of the sorting node.
 */
interface GetNewlinesBetweenErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  /** Configuration options for newlines and groups. */
  options: {
    /** Newlines configuration: 'ignore', or numeric value. */
    newlinesBetween: NewlinesBetweenOption

    /** Optional custom groups configuration. */
    customGroups: CustomGroupsOption

    /** Groups configuration for determining newline requirements. */
    groups: GroupsOptions
  }

  /** Optional function to customize newlines between specific nodes. */
  newlinesBetweenValueGetter?: NewlinesBetweenValueGetter<T>

  /** ESLint source code object for accessing lines. */
  sourceCode: TSESLint.SourceCode

  /** Error message ID for missing required newlines. */
  missedSpacingError: MessageIds

  /** Error message ID for extra unwanted newlines. */
  extraSpacingError: MessageIds

  /** Group index of the right/second node. */
  rightGroupIndex: number

  /** Group index of the left/first node. */
  leftGroupIndex: number

  /** Right/second node in the comparison. */
  right: T

  /** Left/first node in the comparison. */
  left: T
}

/**
 * Checks if the newlines between two nodes match the required configuration.
 *
 * Validates the number of empty lines between two nodes against the expected
 * newlines based on their group indices and configuration. Generates
 * appropriate error messages when the actual newlines don't match the
 * requirement.
 *
 * The function returns no errors if:
 *
 * - The left node's group index is greater than the right's (wrong order)
 * - The nodes are in different partitions
 * - The newlines configuration is set to 'ignore'
 * - The actual newlines match the expected newlines.
 *
 * @example
 *   // Configuration requires 1 newline between different groups
 *   const errors = getNewlinesBetweenErrors({
 *     options: { newlinesBetween: 1, groups: ['imports', 'types'] },
 *     leftGroupIndex: 0, // imports group
 *     rightGroupIndex: 1, // types group
 *     left: importNode,
 *     right: typeNode,
 *     sourceCode,
 *     missedSpacingError: 'missedNewline',
 *     extraSpacingError: 'extraNewline',
 *   })
 *   // If no newline between nodes: Returns ['missedNewline']
 *   // If 2+ newlines between nodes: Returns ['extraNewline']
 *   // If exactly 1 newline: Returns []
 *
 * @template MessageIds - Type of error message identifiers.
 * @template T - Type of the sorting node.
 * @param params - Parameters for newline checking.
 * @returns Array of error message IDs (empty if no errors).
 */
export function getNewlinesBetweenErrors<
  MessageIds extends string,
  T extends SortingNode,
>({
  newlinesBetweenValueGetter,
  missedSpacingError,
  extraSpacingError,
  rightGroupIndex,
  leftGroupIndex,
  sourceCode,
  options,
  right,
  left,
}: GetNewlinesBetweenErrorsParameters<MessageIds, T>): MessageIds[] {
  if (
    leftGroupIndex > rightGroupIndex ||
    left.partitionId !== right.partitionId
  ) {
    return []
  }

  let newlinesBetween = getNewlinesBetweenOption({
    nextNodeGroupIndex: rightGroupIndex,
    nodeGroupIndex: leftGroupIndex,
    options,
  })
  newlinesBetween =
    newlinesBetweenValueGetter?.({
      computedNewlinesBetween: newlinesBetween,
      right,
      left,
    }) ?? newlinesBetween

  let numberOfEmptyLinesBetween = getLinesBetween(sourceCode, left, right)
  if (newlinesBetween === 'ignore') {
    return []
  }

  if (numberOfEmptyLinesBetween < newlinesBetween) {
    return [missedSpacingError]
  }
  if (numberOfEmptyLinesBetween > newlinesBetween) {
    return [extraSpacingError]
  }
  return []
}
