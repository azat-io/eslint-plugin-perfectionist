import type { SingleCustomGroup, Modifier, Selector } from './types'
import type { AnyOfCustomGroup } from '../../types/common-options'

import { matches } from '../../utils/matches'

interface DoesCustomGroupMatchParameters {
  customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup
  elementValue: undefined | string
  selectors: Selector[]
  modifiers: Modifier[]
  decorators: string[]
  elementName: string
}

/**
 * Determines whether a custom group matches the given properties.
 * @param {DoesCustomGroupMatchParameters} props - The properties to match
 * against the custom group, including selectors, modifiers, decorators, and
 * element names.
 * @returns {boolean} `true` if the custom group matches the properties;
 * otherwise, `false`.
 */
export let doesCustomGroupMatch = (
  props: DoesCustomGroupMatchParameters,
): boolean => {
  if ('anyOf' in props.customGroup) {
    // At least one subgroup must match.
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
    'elementValuePattern' in props.customGroup &&
    props.customGroup.elementValuePattern
  ) {
    let matchesElementValuePattern: boolean = matches(
      props.elementValue ?? '',
      props.customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
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
