import type {
  SortModulesOptions,
  SingleCustomGroup,
  AnyOfCustomGroup,
  Modifier,
  Selector,
} from './sort-modules.types'
import type { CompareOptions } from '../utils/compare'

import { matches } from '../utils/matches'

interface CustomGroupMatchesProps {
  customGroup: SingleCustomGroup | AnyOfCustomGroup
  selectors: Selector[]
  modifiers: Modifier[]
  decorators: string[]
  elementName: string
}

/**
 * Determines whether a custom group matches the given properties.
 * @param {CustomGroupMatchesProps} props - The properties to compare with the
 * custom group, including selectors, modifiers, decorators, and element name.
 * @returns {boolean} `true` if the custom group matches the properties;
 * otherwise, `false`.
 */
export let customGroupMatches = (props: CustomGroupMatchesProps): boolean => {
  if ('anyOf' in props.customGroup) {
    // At least one subgroup must match
    return props.customGroup.anyOf.some(subgroup =>
      customGroupMatches({ ...props, customGroup: subgroup }),
    )
  }
  if (
    props.customGroup.selector &&
    !props.selectors.includes(props.customGroup.selector)
  ) {
    return false
  }

  if (props.customGroup.modifiers) {
    for (let modifier of props.customGroup.modifiers) {
      if (!props.modifiers.includes(modifier)) {
        return false
      }
    }
  }

  if (
    'elementNamePattern' in props.customGroup &&
    props.customGroup.elementNamePattern
  ) {
    let matchesElementNamePattern: boolean = matches(
      props.elementName,
      props.customGroup.elementNamePattern,
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }

  if (
    'decoratorNamePattern' in props.customGroup &&
    props.customGroup.decoratorNamePattern
  ) {
    let decoratorPattern = props.customGroup.decoratorNamePattern
    let matchesDecoratorNamePattern: boolean = props.decorators.some(
      decorator => matches(decorator, decoratorPattern),
    )
    if (!matchesDecoratorNamePattern) {
      return false
    }
  }

  return true
}

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 * @param {Required<SortModulesOptions>[0]} options - The sorting options,
 * including groups and custom groups.
 * @param {number} groupNumber - The index of the group to retrieve compare
 * options for.
 * @returns {CompareOptions | null} The compare options for the group, or `null`
 * if the group should not be sorted.
 */
export let getCompareOptions = (
  options: Required<SortModulesOptions[0]>,
  groupNumber: number,
): CompareOptions | null => {
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
    type: customGroup?.type ?? options.type,
    order:
      customGroup && 'order' in customGroup && customGroup.order
        ? customGroup.order
        : options.order,
    specialCharacters: options.specialCharacters,
    ignoreCase: options.ignoreCase,
    locales: options.locales,
  }
}
