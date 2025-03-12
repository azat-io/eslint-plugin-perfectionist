import type { AnyOfCustomGroup } from '../../types/common-options'
import type { SingleCustomGroup, Modifier } from './types'

import { matches } from '../../utils/matches'

interface DoesCustomGroupMatchParameters {
  customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup
  modifiers: Modifier[]
  elementName: string
}

export let doesCustomGroupMatch = (
  props: DoesCustomGroupMatchParameters,
): boolean => {
  if ('anyOf' in props.customGroup) {
    return props.customGroup.anyOf.some(subgroup =>
      doesCustomGroupMatch({ ...props, customGroup: subgroup }),
    )
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

  return true
}
