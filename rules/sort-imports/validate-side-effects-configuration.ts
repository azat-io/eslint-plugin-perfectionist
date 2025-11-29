import type { GroupsOptions } from '../../types/common-groups-options'

import { isStringGroupSideEffectOnlyGroup } from './is-string-group-side-effect-only-group'
import { computeGroupsNames } from '../../utils/compute-groups-names'
import { isSideEffectOnlyGroup } from './is-side-effect-only-group'

/**
 * Validates that side-effect import groups are configured correctly.
 *
 * When sortSideEffects is false, side-effect imports must be in standalone
 * groups, not mixed with regular imports. This prevents unintended reordering
 * that could break code execution order.
 *
 * @param options - Options for validating side-effect groups.
 * @param options.groups - Import group configuration.
 * @param options.sortSideEffects - Whether side-effect imports can be sorted.
 * @throws {Error} If side-effect groups are incorrectly nested with regular
 *   groups.
 */
export function validateSideEffectsConfiguration({
  sortSideEffects,
  groups,
}: {
  sortSideEffects: boolean
  groups: GroupsOptions
}): void {
  if (sortSideEffects) {
    return
  }
  /**
   * Ensure that if `sortSideEffects: false`, no side effect group is in a
   * nested group with non-side-effect groups.
   */
  let hasInvalidGroup = groups
    .map(group => computeGroupsNames([group]))
    .some(
      nestedGroup =>
        hasSideEffectGroup(nestedGroup) && !isSideEffectOnlyGroup(nestedGroup),
    )
  if (hasInvalidGroup) {
    throw new Error(
      "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'.",
    )
  }
}

function hasSideEffectGroup(stringGroups: string[]): boolean {
  return stringGroups.some(isStringGroupSideEffectOnlyGroup)
}
