import type { AnyOfCustomGroup } from '../../types/common-options'
import type { SingleCustomGroup } from './types'

import { matches } from '../../utils/matches'

interface DoesCustomGroupMatchParameters {
  customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup
  elementName: string
}

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
