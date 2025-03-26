import type { AnyOfCustomGroup, RegexOption } from '../types/common-options'

import { matches } from './matches'

export interface DoesCustomGroupMatchParameters {
  elementValue?: string | null
  decorators?: string[]
  modifiers: string[]
  selectors: string[]
  elementName: string
}

interface BaseSingleCustomGroup {
  decoratorNamePattern?: RegexOption
  elementValuePattern?: RegexOption
  elementNamePattern?: RegexOption
  modifiers?: string[]
  selector?: string
}

export let doesCustomGroupMatch = <
  SingleCustomGroup extends BaseSingleCustomGroup,
>(
  props: {
    customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup
  } & DoesCustomGroupMatchParameters,
): boolean => {
  if ('anyOf' in props.customGroup) {
    return props.customGroup.anyOf.some(subgroup =>
      doesSingleCustomGroupMatch({
        ...props,
        customGroup: subgroup,
      }),
    )
  }

  return doesSingleCustomGroupMatch({
    ...props,
    customGroup: props.customGroup,
  })
}

let doesSingleCustomGroupMatch = ({
  elementValue,
  customGroup,
  elementName,
  decorators,
  selectors,
  modifiers,
}: {
  customGroup: BaseSingleCustomGroup
  elementValue?: string | null
  decorators?: string[]
  selectors?: string[]
  modifiers?: string[]
  elementName: string
}): boolean => {
  if (customGroup.selector && !selectors?.includes(customGroup.selector)) {
    return false
  }

  if (customGroup.modifiers) {
    for (let modifier of customGroup.modifiers) {
      if (!modifiers?.includes(modifier)) {
        return false
      }
    }
  }

  if ('elementNamePattern' in customGroup && customGroup.elementNamePattern) {
    let matchesElementNamePattern: boolean = matches(
      elementName,
      customGroup.elementNamePattern,
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }

  if ('elementValuePattern' in customGroup && customGroup.elementValuePattern) {
    let matchesElementValuePattern: boolean = matches(
      elementValue ?? '',
      customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
      return false
    }
  }

  if (
    'decoratorNamePattern' in customGroup &&
    customGroup.decoratorNamePattern
  ) {
    let decoratorPattern = customGroup.decoratorNamePattern
    let matchesDecoratorNamePattern = decorators?.some(decorator =>
      matches(decorator, decoratorPattern),
    )
    if (!matchesDecoratorNamePattern) {
      return false
    }
  }

  return true
}
