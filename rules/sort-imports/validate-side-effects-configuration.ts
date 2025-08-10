import type { GroupsOptions } from '../../types/common-options'
import type { Group } from './types'

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
  groups: GroupsOptions<Group>
  sortSideEffects: boolean
}): void {
  if (sortSideEffects) {
    return
  }
  /**
   * Ensure that if `sortSideEffects: false`, no side effect group is in a
   * nested group with non-side-effect groups.
   */
  let hasInvalidGroup = groups
    .filter(group => Array.isArray(group))
    .some(
      nestedGroup =>
        !isSideEffectOnlyGroup(nestedGroup) &&
        nestedGroup.some(
          subGroup =>
            subGroup === 'side-effect' || subGroup === 'side-effect-style',
        ),
    )
  if (hasInvalidGroup) {
    throw new Error(
      "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'.",
    )
  }
}
