import type { SingleCustomGroup, AnyOfCustomGroup } from './types'

import { matches } from '../../utils/matches'

interface DoesCustomGroupMatchProps {
  customGroup: SingleCustomGroup | AnyOfCustomGroup
  elementValue: string
  elementName: string
}

export let doesCustomGroupMatch = (
  props: DoesCustomGroupMatchProps,
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

  if (
    'elementValuePattern' in props.customGroup &&
    props.customGroup.elementValuePattern
  ) {
    let matchesElementValuePattern: boolean = matches(
      props.elementValue,
      props.customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
      return false
    }
  }

  return true
}
