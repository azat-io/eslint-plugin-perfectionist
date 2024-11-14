import type { TSESTree } from '@typescript-eslint/utils'

import type {
  SortClassesOptions,
  SingleCustomGroup,
  AnyOfCustomGroup,
  Modifier,
  Selector,
} from './sort-classes.types'
import type { CompareOptions } from '../utils/compare'

import { isSortable } from '../utils/is-sortable'
import { matches } from '../utils/matches'

interface CustomGroupMatchesProps {
  customGroup: SingleCustomGroup | AnyOfCustomGroup
  elementValue: undefined | string
  selectors: Selector[]
  modifiers: Modifier[]
  decorators: string[]
  elementName: string
}

/**
 * Returns a list of groups of overload signatures.
 */
export let getOverloadSignatureGroups = (
  members: TSESTree.ClassElement[],
): TSESTree.ClassElement[][] => {
  let methods = members
    .filter(
      member =>
        member.type === 'MethodDefinition' ||
        member.type === 'TSAbstractMethodDefinition',
    )
    .filter(member => member.kind === 'method')
  // Static and non-static overload signatures can coexist with the same name
  let staticOverloadSignaturesByName = new Map<
    string,
    TSESTree.ClassElement[]
  >()
  let overloadSignaturesByName = new Map<string, TSESTree.ClassElement[]>()
  for (let method of methods) {
    if (method.key.type !== 'Identifier') {
      continue
    }
    let { name } = method.key
    let mapToUse = method.static
      ? staticOverloadSignaturesByName
      : overloadSignaturesByName
    let signatureOverloadsGroup = mapToUse.get(name)
    if (!signatureOverloadsGroup) {
      signatureOverloadsGroup = []
      mapToUse.set(name, signatureOverloadsGroup)
    }
    signatureOverloadsGroup.push(method)
  }
  // Ignore groups that only have one method
  return [
    ...overloadSignaturesByName.values(),
    ...staticOverloadSignaturesByName.values(),
  ].filter(isSortable)
}

/**
 * Returns whether a custom group matches the given properties
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

/**
 * Returns the compare options used to sort a given group.
 * If the group is a custom group, its options will be favored over the default options.
 * Returns null if the group should not be sorted
 */
export let getCompareOptions = (
  options: Required<SortClassesOptions[0]>,
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
