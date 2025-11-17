import type { GroupsOptions } from '../types/common-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { isNewlinesBetweenOption } from './is-newlines-between-option'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Computes the names of all groups based on the provided `GroupsOptions`.
 *
 * @param groups - An array of group options.
 * @returns An array of computed group names as strings.
 */
export function computeGroupsNames(groups: GroupsOptions<string>): string[] {
  return groups.flatMap(group => computeGroupNames(group))
}

function computeGroupNames(group: GroupsOptions<string>[number]): string[] {
  if (typeof group === 'string' || Array.isArray(group)) {
    return computeStringGroupNames(group)
  }
  if (isGroupWithOverridesOption(group)) {
    return computeStringGroupNames(group.group)
  }
  if (isNewlinesBetweenOption(group)) {
    return []
    /* v8 ignore next 3 */
  }
  throw new UnreachableCaseError(group)
}

function computeStringGroupNames(group: string[] | string): string[] {
  if (typeof group === 'string') {
    return [group]
  }
  return group
}
