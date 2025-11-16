import type { GroupsOptions } from '../types/common-options'

import { computeGroupsNames } from './compute-groups-names'

/**
 * Validates that consecutive objects in groups are merged into single objects.
 *
 * Prevents configuration confusion by ensuring that spacing and comment
 * directives are consolidated. Consecutive objects for `newlinesBetween` or
 * `commentAbove` should be merged into a single object for clarity and to avoid
 * ambiguous behavior.
 *
 * @example
 *   // Invalid: Consecutive objects
 *   validateObjectsInsideGroups({
 *     groups: [
 *       'react',
 *       { newlinesBetween: 1 },
 *       { commentAbove: '// External libraries' }, // Error: consecutive objects
 *       'external',
 *     ],
 *   })
 *   // Throws: Consecutive objects are not allowed: merge them into a single object
 *
 * @example
 *   // Valid: Merged into single object
 *   validateObjectsInsideGroups({
 *     groups: [
 *       'react',
 *       {
 *         newlinesBetween: 1,
 *         commentAbove: '// External libraries',
 *       },
 *       'external',
 *     ],
 *   })
 *   // Correct: Single object with both directives
 *
 * @example
 *   // Valid: Non-consecutive objects
 *   validateObjectsInsideGroups({
 *     groups: [
 *       'react',
 *       { newlinesBetween: 1 },
 *       'external',
 *       { newlinesBetween: 1 },
 *       'internal',
 *     ],
 *   })
 *   // OK: Objects separated by string groups
 *
 * @param options - Configuration object containing groups.
 * @throws {Error} If consecutive objects are found in groups.
 */
export function validateObjectsInsideGroups({
  groups,
}: {
  groups: GroupsOptions<string>
}): void {
  let isPreviousElementNonGroupBased = false
  for (let group of groups) {
    let [groupName] = computeGroupsNames([group])
    if (groupName) {
      isPreviousElementNonGroupBased = false
      continue
    }

    if (isPreviousElementNonGroupBased) {
      throw new Error('Consecutive `newlinesBetween` objects are not allowed')
    }
    isPreviousElementNonGroupBased = true
  }
}
