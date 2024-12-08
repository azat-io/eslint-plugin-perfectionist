import type { CompareOptions } from './compare'
import type { SortingNode } from '../typings'

interface Options {
  customGroups: Record<string, string[] | string> | CustomGroup[]
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  groups: (string[] | string)[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}

type CustomGroup = (
  | {
      type?: 'alphabetical' | 'line-length' | 'natural' | 'custom'
      order?: 'desc' | 'asc'
    }
  | {
      type?: 'unsorted'
    }
) & {
  groupName: string
}

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 * @param {Options} options - The sorting options,
 * including groups and custom groups.
 * @param {number} groupNumber - The index of the group to retrieve compare
 * options for.
 * @returns {CompareOptions | null} The compare options for the group, or `null`
 * if the group should not be sorted.
 */
export let getCustomGroupsCompareOptions = <T extends SortingNode>(
  options: Required<Options>,
  groupNumber: number,
): CompareOptions<T> | null => {
  if (!Array.isArray(options.customGroups)) {
    return options
  }
  let group = options.groups[groupNumber]
  let customGroup =
    typeof group === 'string'
      ? options.customGroups.find(
          currentGroup => group === currentGroup.groupName,
        )
      : null
  if (customGroup?.type === 'unsorted') {
    return null
  }
  return {
    order:
      customGroup && 'order' in customGroup && customGroup.order
        ? customGroup.order
        : options.order,
    specialCharacters: options.specialCharacters,
    type: customGroup?.type ?? options.type,
    ignoreCase: options.ignoreCase,
    alphabet: options.alphabet,
    locales: options.locales,
  }
}
