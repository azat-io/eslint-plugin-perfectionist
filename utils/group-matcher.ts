import type {
  CommonGroupsOptions,
  CustomGroupsOption,
} from '../types/common-groups-options'

import { parsePredefinedGroup } from './parse-predefined-group'
import { computeGroupsNames } from './compute-groups-names'

type CustomGroupMatcher<AdditionalSortOptions> = (
  customGroup: CustomGroupsOption<
    string,
    AdditionalSortOptions,
    unknown
  >[number],
) => boolean

/**
 * A predefined group from the `groups` option, split into its selector and
 * modifiers.
 */
class GroupName<Selector extends string, Modifier extends string> {
  public readonly name: string
  private readonly _modifiers: Modifier[]
  private readonly _selector: Selector

  public constructor({
    modifiers,
    selector,
    name,
  }: {
    modifiers: Modifier[]
    selector: Selector
    name: string
  }) {
    this.name = name
    this._selector = selector
    this._modifiers = modifiers
  }

  /**
   * Parses a group name from the `groups` option.
   *
   * @param params - Parameters object.
   * @param params.allSelectors - Available selectors for the rule.
   * @param params.allModifiers - Available modifiers for the rule.
   * @param params.name - Group name to parse.
   * @returns The parsed group, or null if the name is not a predefined group.
   */
  public static parse<Selector extends string, Modifier extends string>({
    allSelectors,
    allModifiers,
    name,
  }: {
    allSelectors: readonly Selector[]
    allModifiers: readonly Modifier[]
    name: string
  }): GroupName<Selector, Modifier> | null {
    let parsedGroup = parsePredefinedGroup({
      allSelectors,
      allModifiers,
      name,
    })
    if (!parsedGroup) {
      return null
    }

    return new GroupName({
      ...parsedGroup,
      name,
    })
  }

  /**
   * Compares two groups by specificity. More specific groups come first: by
   * selector order in `allSelectors`, then by modifier count, then by modifier
   * order in `allModifiers`.
   *
   * @param other - Group to compare with.
   * @param params - Parameters object.
   * @param params.selectorsByIndex - Index of each selector in `allSelectors`.
   * @param params.modifiersByIndex - Index of each modifier in `allModifiers`.
   * @returns A negative number if this group is more specific, a positive
   *   number if it is less specific, 0 otherwise.
   */
  public compare(
    other: GroupName<Selector, Modifier>,
    {
      selectorsByIndex,
      modifiersByIndex,
    }: {
      selectorsByIndex: Map<Selector, number>
      modifiersByIndex: Map<Modifier, number>
    },
  ): number {
    let selfSelectorIndex = selectorsByIndex.get(this._selector)!
    let otherSelectorIndex = selectorsByIndex.get(other._selector)!
    if (selfSelectorIndex !== otherSelectorIndex) {
      return selfSelectorIndex < otherSelectorIndex ? -1 : 1
    }
    let selfModifierCount = this._modifiers.length
    let otherModifierCount = other._modifiers.length
    if (selfModifierCount !== otherModifierCount) {
      return selfModifierCount > otherModifierCount ? -1 : 1
    }
    for (let i = 0; i < selfModifierCount; i++) {
      let selfModifierIndex = modifiersByIndex.get(this._modifiers[i]!)!
      let otherModifierIndex = modifiersByIndex.get(other._modifiers[i]!)!
      if (selfModifierIndex !== otherModifierIndex) {
        return selfModifierIndex < otherModifierIndex ? -1 : 1
      }
    }

    return 0
  }

  /**
   * Checks if an element belongs to this group.
   *
   * @param params - Parameters object.
   * @param params.selectors - Selectors of the element.
   * @param params.modifiers - Modifiers of the element.
   * @returns True if the element has the selector and every modifier of the
   *   group.
   */
  public doesMatch({
    selectors,
    modifiers,
  }: {
    selectors: Selector[]
    modifiers: Modifier[]
  }): boolean {
    return (
      selectors.includes(this._selector) &&
      this._modifiers.every(modifier => modifiers.includes(modifier))
    )
  }
}

const CACHED_PREDEFINED_GROUPS_BY_SELECTORS = new WeakMap<
  readonly string[],
  Map<string, GroupName<string, string>[]>
>()

/**
 * Computes the group of an element from the groups listed in the `groups`
 * option.
 *
 * Custom groups are checked first, in the order of `customGroups`. Predefined
 * groups are then checked from the most to the least specific.
 *
 * @example
 *
 * ```ts
 * let groupMatcher = new GroupMatcher({
 *   options: { groups: ['method', 'static-method'], customGroups: [] },
 *   allSelectors: ['method'],
 *   allModifiers: ['static'],
 * })
 * groupMatcher.computeGroup({
 *   customGroupMatcher: () => false,
 *   modifiers: ['static'],
 *   selectors: ['method'],
 * })
 * // Returns: 'static-method'
 * ```
 */
export class GroupMatcher<
  AdditionalSortOptions,
  Selector extends string,
  Modifier extends string,
> {
  private readonly _customGroups: CustomGroupsOption<
    string,
    AdditionalSortOptions,
    unknown
  >
  private readonly _predefinedGroups: GroupName<Selector, Modifier>[]

  public constructor({
    allSelectors,
    allModifiers,
    options,
  }: {
    options: Pick<
      CommonGroupsOptions<string, AdditionalSortOptions, unknown>,
      'customGroups' | 'groups'
    >
    allSelectors: readonly Selector[]
    allModifiers: readonly Modifier[]
  }) {
    let groupsList = computeGroupsNames(options.groups)
    let groupsSet = new Set(groupsList)
    this._customGroups = options.customGroups.filter(group =>
      groupsSet.has(group.groupName),
    )

    /*
     * Every name in `groups` is a predefined group candidate, custom group
     * names included: a custom group that reuses a predefined group name keeps
     * that predefined group as a fallback. Names that are not predefined groups
     * are dropped when parsed.
     */
    let predefinedGroupNames = groupsList

    let cachedPredefinedGroupsByKey =
      CACHED_PREDEFINED_GROUPS_BY_SELECTORS.get(allSelectors)
    if (!cachedPredefinedGroupsByKey) {
      cachedPredefinedGroupsByKey = new Map()
      CACHED_PREDEFINED_GROUPS_BY_SELECTORS.set(
        allSelectors,
        cachedPredefinedGroupsByKey,
      )
    }
    let cacheKey = `${allModifiers.join(',')}/${predefinedGroupNames.join(',')}`
    let cachedPredefinedGroups = cachedPredefinedGroupsByKey.get(cacheKey)
    if (cachedPredefinedGroups) {
      this._predefinedGroups = cachedPredefinedGroups as GroupName<
        Selector,
        Modifier
      >[]
      return
    }

    this._predefinedGroups = GroupMatcher._computePredefinedGroups({
      predefinedGroupNames,
      allSelectors,
      allModifiers,
    })
    cachedPredefinedGroupsByKey.set(cacheKey, this._predefinedGroups)
  }

  private static _computePredefinedGroups<
    Selector extends string,
    Modifier extends string,
  >({
    predefinedGroupNames,
    allSelectors,
    allModifiers,
  }: {
    allSelectors: readonly Selector[]
    allModifiers: readonly Modifier[]
    predefinedGroupNames: string[]
  }): GroupName<Selector, Modifier>[] {
    let selectorsByIndex = GroupMatcher._buildElementByIndexMap(allSelectors)
    let modifiersByIndex = GroupMatcher._buildElementByIndexMap(allModifiers)

    return predefinedGroupNames
      .map(name =>
        GroupName.parse({
          allModifiers,
          allSelectors,
          name,
        }),
      )
      .filter(groupName => !!groupName)
      .toSorted((a, b) =>
        a.compare(b, {
          selectorsByIndex,
          modifiersByIndex,
        }),
      )
  }

  private static _buildElementByIndexMap<T extends string>(
    array: readonly T[],
  ): Map<T, number> {
    let returnValue = new Map<T, number>()
    for (let [i, element] of array.entries()) {
      returnValue.set(element, i)
    }
    return returnValue
  }

  /**
   * Computes the group of an element.
   *
   * @param params - Parameters object.
   * @param params.customGroupMatcher - Checks if the element matches a custom
   *   group.
   * @param params.selectors - Selectors of the element.
   * @param params.modifiers - Modifiers of the element.
   * @returns The name of the first matching group, or 'unknown'.
   */
  public computeGroup({
    customGroupMatcher,
    selectors,
    modifiers,
  }: {
    customGroupMatcher: CustomGroupMatcher<AdditionalSortOptions>
    selectors: Selector[]
    modifiers: Modifier[]
  }): string {
    for (let customGroup of this._customGroups) {
      if (customGroupMatcher(customGroup)) {
        return customGroup.groupName
      }
    }

    for (let predefinedGroup of this._predefinedGroups) {
      if (predefinedGroup.doesMatch({ selectors, modifiers })) {
        return predefinedGroup.name
      }
    }

    return 'unknown'
  }
}
