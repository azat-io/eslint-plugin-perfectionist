import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  AnyOfCustomGroup,
  GroupsOptions,
} from '../types/common-options'

import { matches } from './matches'

interface GetGroupParameters<SingleCustomGroup> {
  options: {
    customGroups?:
      | CustomGroupsOption<SingleCustomGroup>
      | DeprecatedCustomGroupsOption
    groups: GroupsOptions<string>
  }
  customGroupMatcher?(
    customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup,
  ): boolean
  predefinedGroups: string[]
  name?: string
}

export function computeGroup<SingleCustomGroup>({
  customGroupMatcher,
  predefinedGroups,
  options,
  name,
}: GetGroupParameters<SingleCustomGroup>): 'unknown' | string {
  let group: undefined | string
  // For lookup performance.
  let groupsSet = new Set(options.groups.flat())

  function defineGroup(value: string[] | string): boolean {
    if (Array.isArray(value)) {
      return value.some(defineGroup)
    }
    if (group || !groupsSet.has(value)) {
      return false
    }
    group = value
    return true
  }

  if (options.customGroups) {
    if (Array.isArray(options.customGroups)) {
      for (let customGroup of options.customGroups) {
        if (customGroupMatcher?.(customGroup)) {
          let groupDefined = defineGroup(customGroup.groupName)
          if (groupDefined) {
            break
          }
        }
      }
    } else if (name) {
      for (let [key, pattern] of Object.entries(options.customGroups)) {
        if (matches(name, pattern)) {
          let groupDefined = defineGroup(key)
          if (groupDefined) {
            break
          }
        }
      }
    }
  }

  defineGroup(predefinedGroups)

  return group ?? 'unknown'
}
