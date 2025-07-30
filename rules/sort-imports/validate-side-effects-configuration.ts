import type { GroupsOptions } from '../../types/common-options'
import type { Group } from './types'

import { isSideEffectOnlyGroup } from './is-side-effect-only-group'

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
