import type {
  CommonGroupsOptions,
  CustomGroupsOption,
} from '../types/common-groups-options'

import { computeGroupsNames } from './compute-groups-names'

type CustomGroupMatcher<AdditionalSortOptions> = (
  customGroup: CustomGroupsOption<
    string,
    AdditionalSortOptions,
    unknown
  >[number],
) => boolean

class GroupName<Selector extends string, Modifier extends string> {
  public readonly name: string
  private readonly _modifiers: Modifier[]
  private readonly _selector: Selector

  public constructor({
    modifiers,
    selector,
    name,
  }: {
    allSelectors: readonly Selector[]
    allModifiers: readonly Modifier[]
    modifiers: Modifier[]
    selector: Selector
    name: string
  }) {
    this.name = name
    this._selector = selector
    this._modifiers = modifiers
  }

  public static parse<Selector extends string, Modifier extends string>({
    allSelectors,
    allModifiers,
    name,
  }: {
    allSelectors: readonly Selector[]
    allModifiers: readonly Modifier[]
    name: string
  }): GroupName<Selector, Modifier> | null {
    let possibleSelectors = computePossibleElements()
    let selector = allSelectors.find(currentSelector =>
      possibleSelectors.has(currentSelector),
    )
    if (!selector) {
      return null
    }

    let rest = name.slice(0, -selector.length)
    let modifiers = allModifiers.filter(modifier =>
      new RegExp(`(?:^|-)${modifier}-`).test(rest),
    )

    return new GroupName({
      allSelectors,
      allModifiers,
      modifiers,
      selector,
      name,
    })

    function computePossibleElements(): Set<string> {
      let elementsSeparatedWithDash = name.split('-')
      return new Set([
        elementsSeparatedWithDash.slice(-3).join('-'),
        elementsSeparatedWithDash.slice(-2).join('-'),
        elementsSeparatedWithDash.at(-1)!,
      ])
    }
  }

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

    /* v8 ignore next -- @preserve Impossible case */
    return 0
  }

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
  private readonly _selectorsByIndex: Map<Selector, number>
  private readonly _modifiersByIndex: Map<Modifier, number>

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
    this._selectorsByIndex = GroupMatcher._buildElementByIndexMap(allSelectors)
    this._modifiersByIndex = GroupMatcher._buildElementByIndexMap(allModifiers)

    let groupsList = computeGroupsNames(options.groups)
    let groupsSet = new Set(groupsList)
    this._customGroups = options.customGroups.filter(group =>
      groupsSet.has(group.groupName),
    )

    let customGroupNameSet = new Set(
      this._customGroups.map(group => group.groupName),
    )
    this._predefinedGroups = groupsList
      .filter(name => !customGroupNameSet.has(name))
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
          selectorsByIndex: this._selectorsByIndex,
          modifiersByIndex: this._modifiersByIndex,
        }),
      )
  }

  private static _buildElementByIndexMap<T extends string>(
    array: readonly T[],
  ): Map<T, number> {
    let returnValue = new Map<T, number>()
    for (let [i, allSelector] of array.entries()) {
      returnValue.set(allSelector, i)
    }
    return returnValue
  }

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
