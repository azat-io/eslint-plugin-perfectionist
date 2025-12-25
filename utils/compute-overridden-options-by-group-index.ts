import type { CommonGroupsOptions } from '../types/common-groups-options'
import type { CommonOptions } from '../types/common-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { computeGroupName } from './compute-group-name'

type Options = Pick<
  CommonGroupsOptions<unknown, unknown, string>,
  'customGroups' | 'groups'
> &
  CommonOptions

/**
 * Retrieves sorting options potentially overridden by a custom group or group
 * with settings configuration.
 *
 * Checks if the group at the specified index is a custom group with its own
 * sorting configuration. If so, returns the overridden options (type, order,
 * fallbackSort). Otherwise, returns the original options.
 *
 * Custom groups can override:
 *
 * - Sort type (e.g., use 'natural' instead of global 'alphabetical')
 * - Sort order (e.g., use 'desc' instead of global 'asc')
 * - Fallback sort configuration.
 *
 * @example
 *   const options = {
 *     type: 'alphabetical',
 *     order: 'asc',
 *     fallbackSort: { type: 'natural' },
 *     groups: ['custom-group', 'other'],
 *     customGroups: [
 *       {
 *         groupName: 'custom-group',
 *         type: 'natural',
 *         order: 'desc',
 *       },
 *     ],
 *   }
 *   const overridden = computeOverriddenOptionsByGroupIndex(options, 0)
 *   // Returns: { type: 'natural', order: 'desc', fallbackSort: { type: 'natural' } }
 *
 * @param options - Combined group and sorting options.
 * @param groupIndex - Index of the group to check for overrides.
 * @returns Sorting options, potentially overridden by custom group
 *   configuration.
 */
export function computeOverriddenOptionsByGroupIndex<T extends Options>(
  options: T,
  groupIndex: number,
): T {
  let { customGroups, groups } = options

  let matchingGroup = groups[groupIndex]
  let matchingGroupName = matchingGroup ? computeGroupName(matchingGroup) : null
  let customGroup = customGroups.find(
    currentGroup => matchingGroupName === currentGroup.groupName,
  )

  let returnValue: T = {
    ...options,
  }
  if (matchingGroup && isGroupWithOverridesOption(matchingGroup)) {
    let { newlinesInside, commentAbove, group, ...relevantGroupFields } =
      matchingGroup
    returnValue = {
      ...returnValue,
      ...relevantGroupFields,
    }
  }

  if (customGroup) {
    let {
      elementNamePattern,
      newlinesInside,
      fallbackSort,
      groupName,
      ...relevantCustomGroupFields
    } = customGroup
    returnValue = {
      ...returnValue,
      ...relevantCustomGroupFields,
      fallbackSort: {
        ...returnValue.fallbackSort,
        ...fallbackSort,
      },
    }
  }

  return returnValue
}
