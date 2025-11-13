import type { GroupsOptions } from '../types/common-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { isCommentAboveOption } from './is-comment-above-option'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Computes the name of a group based on the provided group object.
 *
 * @param group - The group object.
 * @returns A string if the group is a string.
 */
export function computeGroupName(
  group: GroupsOptions<string>[number],
): string | null {
  if (typeof group === 'string' || Array.isArray(group)) {
    return computeStringGroupName(group)
  }
  if (isCommentAboveOption(group)) {
    return null
  }
  if (isNewlinesBetweenOption(group)) {
    return null
    /* v8 ignore next 3 */
  }
  throw new UnreachableCaseError(group)
}

function computeStringGroupName(group: string[] | string): string | null {
  if (typeof group === 'string') {
    return group
  }
  return null
}
