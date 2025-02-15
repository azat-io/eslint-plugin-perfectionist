import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  FallbackSortOption,
  GroupsOptions,
  OrderOption,
  TypeOption,
} from '../types/common-options'
import type { BaseSortNodesByGroupsOptions } from './sort-nodes-by-groups'

interface GroupRelatedOptions {
  customGroups: DeprecatedCustomGroupsOption | CustomGroupsOption
  groups: GroupsOptions<string>
}

interface OverridableOptions {
  fallbackSort: FallbackSortOption
  order: OrderOption
  type: TypeOption
}

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 * @param {GroupRelatedOptions & OverridableOptions} options - The sorting options, including groups and
 * custom groups.
 * @param {number} groupNumber - The index of the group to retrieve compare
 * options for.
 * @returns {object} The options for the group
 */
export let getCustomGroupsCompareOptions = (
  options: GroupRelatedOptions & OverridableOptions,
  groupNumber: number,
): OverridableOptions => {
  let { customGroups, fallbackSort, groups, order, type } = options

  if (Array.isArray(customGroups)) {
    let group = groups[groupNumber]
    let customGroup =
      typeof group === 'string'
        ? customGroups.find(currentGroup => group === currentGroup.groupName)
        : null

    if (customGroup) {
      fallbackSort = {
        type: customGroup.fallbackSort?.type ?? fallbackSort.type,
      }
      let fallbackOrder = customGroup.fallbackSort?.order ?? fallbackSort.order
      if (fallbackOrder) {
        fallbackSort.order = fallbackOrder
      }
      order = customGroup.order ?? order
      type = customGroup.type ?? type
    }
  }

  return {
    fallbackSort,
    order,
    type,
  }
}

export let buildGetCustomGroupOverriddenOptionsFunction =
  (
    options: BaseSortNodesByGroupsOptions & GroupRelatedOptions,
  ): ((groupNumber: number) => {
    options: BaseSortNodesByGroupsOptions
  }) =>
  (groupNumber: number) => ({
    options: getCustomGroupOverriddenOptions({
      groupNumber,
      options,
    }),
  })

export let getCustomGroupOverriddenOptions = ({
  groupNumber,
  options,
}: {
  options: BaseSortNodesByGroupsOptions & GroupRelatedOptions
  groupNumber: number
}): BaseSortNodesByGroupsOptions => ({
  ...options,
  ...getCustomGroupsCompareOptions(options, groupNumber),
})
