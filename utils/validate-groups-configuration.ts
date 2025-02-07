import type { GroupsOptions } from '../types/common-options'

import { validateNoDuplicatedGroups } from './validate-no-duplicated-groups'
import { isNewlinesBetweenOption } from './is-newlines-between-option'

interface ValidateGroupsConfigurationParameters {
  options: {
    groups: GroupsOptions<string>
  }
  allowedPredefinedGroups: string[]
  allowedCustomGroups: string[]
}

/**
 * Throws an error if one of the following conditions is met:
 * - One or more groups specified in `groups` are not predefined nor specified
 * in `customGroups`
 * - A group is specified in `groups` more than once
 * @param {object} parameters - Parameters object.
 * @param {object} parameters.options - Options containing the groups to validate.
 * @param {string[]} parameters.allowedPredefinedGroups - An array of predefined
 * group names that are considered valid.
 * @param {string[]} parameters.allowedCustomGroups - An array of custom group
 * names that are considered valid.
 * @throws Error Will throw an error if invalid or duplicated groups are found.
 */
export let validateGroupsConfiguration = ({
  allowedPredefinedGroups,
  allowedCustomGroups,
  options,
}: ValidateGroupsConfigurationParameters): void => {
  let allowedGroupsSet = new Set([
    ...allowedPredefinedGroups,
    ...allowedCustomGroups,
  ])
  let invalidGroups: string[] = []
  let isPreviousElementNewlinesBetween = false
  for (let groupElement of options.groups) {
    if (isNewlinesBetweenOption(groupElement)) {
      // There should not be two consecutive `newlinesBetween` objects
      if (isPreviousElementNewlinesBetween) {
        throw new Error("Consecutive 'newlinesBetween' objects are not allowed")
      }
      isPreviousElementNewlinesBetween = true
    } else {
      isPreviousElementNewlinesBetween = false
      let groupElements = Array.isArray(groupElement)
        ? groupElement
        : [groupElement]
      for (let group of groupElements) {
        if (!allowedGroupsSet.has(group)) {
          invalidGroups.push(group)
        }
      }
    }
  }
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(options)
}
