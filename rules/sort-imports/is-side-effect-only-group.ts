import type { GroupsOptions } from '../../types/common-options'

import { isNewlinesBetweenOption } from '../../utils/is-newlines-between-option'
import { isCommentAboveOption } from '../../utils/is-comment-above-option'

/**
 * Checks if a group is a side-effect-only group.
 *
 * A side-effect-only group is one that contains no imports or exports, and is
 * typically used for modules that only execute code without exporting any
 * values.
 *
 * @param group - The group to check.
 * @returns True if the group is a side-effect-only group, false otherwise.
 */
export function isSideEffectOnlyGroup(
  group: GroupsOptions<string>[0],
): boolean {
  if (isNewlinesBetweenOption(group) || isCommentAboveOption(group)) {
    return false
  }
  if (typeof group === 'string') {
    return group === 'side-effect' || group === 'side-effect-style'
  }

  return group.every(isSideEffectOnlyGroup)
}
