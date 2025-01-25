import type { SingleCustomGroup, AnyOfCustomGroup, Selector } from './types'

import { matches } from '../../utils/matches'

interface DoesCustomGroupMatchParameters {
  customGroup: SingleCustomGroup | AnyOfCustomGroup
  selectors: Selector[]
  elementName: string
}

/**
 * Determines whether a custom group matches the given properties.
 * @param {DoesCustomGroupMatchParameters} props - The properties to compare
 * with the custom group, including selectors, modifiers, and element name.
 * @returns {boolean} `true` if the custom group matches the properties;
 * otherwise, `false`.
 */
export let doesCustomGroupMatch = (
  props: DoesCustomGroupMatchParameters,
): boolean => {
  if ('anyOf' in props.customGroup) {
    // At least one subgroup must match
    return props.customGroup.anyOf.some(subgroup =>
      doesCustomGroupMatch({ ...props, customGroup: subgroup }),
    )
  }
  if (
    props.customGroup.selector &&
    !props.selectors.includes(props.customGroup.selector)
  ) {
    return false
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

  return true
}
