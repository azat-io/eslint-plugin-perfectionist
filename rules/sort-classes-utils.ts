import { minimatch } from 'minimatch'
import type { TSESTree } from '@typescript-eslint/utils'

import type { Modifier, Selector } from './sort-classes'

import type { CustomGroup, Modifier, Selector } from './sort-classes.types'

interface CustomGroupMatchesProps {
  memberValueType:
    | 'ArrowFunctionExpression'
    | 'FunctionExpression'
    | undefined
    | string
  customGroup: CustomGroup
  selectors: Selector[]
  modifiers: Modifier[]
  decorators: string[]
  elementName: string
}
/**
 * Cache computed groups by modifiers and selectors for performance
 */
const cachedGroupsByModifiersAndSelectors = new Map<string, string[]>()

/**
 * Generates an ordered list of groups associated to modifiers and selectors entered
 * The groups are generated by combining all possible combinations of modifiers with one selector in the end
 * Selectors are prioritized over modifiers quantity. This means that
 * `protected abstract override get fields();` should prioritize the 'get-method' group over the 'protected-abstract-override-method' group.
 * @param modifiers List of modifiers associated to the selector, i.e ['abstract', 'protected']
 * @param selectors List of selectors, i.e ['get-method', 'method', 'property']
 */
export const generateOfficialGroups = (
  modifiers: Modifier[],
  selectors: Selector[],
): string[] => {
  let modifiersAndSelectorsKey = modifiers.join('&') + '/' + selectors.join('&')
  let cachedValue = cachedGroupsByModifiersAndSelectors.get(
    modifiersAndSelectorsKey,
  )
  if (cachedValue) {
    return cachedValue
  }
  let allModifiersCombinations: string[][] = []
  for (let i = modifiers.length; i > 0; i--) {
    allModifiersCombinations = [
      ...allModifiersCombinations,
      ...getCombinations(modifiers, i),
    ]
  }
  let allModifiersCombinationPermutations = allModifiersCombinations.flatMap(
    result => getPermutations(result),
  )
  let returnValue: string[] = []
  for (let selector of selectors) {
    returnValue = [
      ...returnValue,
      ...allModifiersCombinationPermutations.map(
        modifiersCombinationPermutation =>
          [...modifiersCombinationPermutation, selector].join('-'),
      ),
      selector,
    ]
  }
  cachedGroupsByModifiersAndSelectors.set(modifiersAndSelectorsKey, returnValue)
  return returnValue
}

/**
 * Get possible combinations of n elements from an array
 */
const getCombinations = (array: string[], n: number): string[][] => {
  let result: string[][] = []

  let backtrack = (start: number, comb: string[]) => {
    if (comb.length === n) {
      result.push([...comb])
      return
    }
    for (let i = start; i < array.length; i++) {
      comb.push(array[i])
      backtrack(i + 1, comb)
      comb.pop()
    }
  }

  backtrack(0, [])
  return result
}

/**
 * Get all permutations of an array
 * This allows 'abstract-override-protected-get-method', 'override-protected-abstract-get-method',
 * 'protected-abstract-override-get-method'... to be entered by the user and always match the same group
 * This can theoretically cause performance issues in case users enter too many modifiers at once? 8 modifiers would result
 * in 40320 permutations, 9 in 362880.
 */
const getPermutations = (elements: string[]): string[][] => {
  let result: string[][] = []
  let backtrack = (first: number) => {
    if (first === elements.length) {
      result.push([...elements])
      return
    }
    for (let i = first; i < elements.length; i++) {
      ;[elements[first], elements[i]] = [elements[i], elements[first]]
      backtrack(first + 1)
      ;[elements[first], elements[i]] = [elements[i], elements[first]]
    }
  }
  backtrack(0)

  return result
}

/**
 * Returns a list of groups of overload signatures.
 */
export const getOverloadSignatureGroups = (
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
  ].filter(group => group.length > 1)
}


export const customGroupMatches = (props: CustomGroupMatchesProps): boolean => {
  if (!props.selectors.includes(props.customGroup.selector)) {
    return false
  }

  if (props.customGroup.selector === 'static-block') {
    return true
  }

  if (props.customGroup.modifiers) {
    for (let modifier of props.customGroup.modifiers) {
      if (!props.modifiers.includes(modifier)) {
        return false
      }
    }
  }

  if (
    props.customGroup.selector === 'constructor' ||
    props.customGroup.selector === 'index-signature'
  ) {
    return true
  }

  if (props.customGroup.elementNamePattern) {
    let matchesElementNamePattern: boolean = minimatch(
      props.elementName,
      props.customGroup.elementNamePattern,
      {
        nocomment: true,
      },
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }

  if (props.customGroup.decoratorNamePattern) {
    let decoratorPattern = props.customGroup.decoratorNamePattern
    let matchesDecoratorNamePattern: boolean = props.decorators.some(
      decorator =>
        minimatch(decorator, decoratorPattern, {
          nocomment: true,
        }),
    )
    if (!matchesDecoratorNamePattern) {
      return false
    }
  }

  if (
    props.customGroup.selector === 'method' ||
    props.customGroup.selector === 'get-method' ||
    props.customGroup.selector === 'set-method'
  ) {
    return true
  }

  if (props.customGroup.valueTypePattern) {
    if (!props.memberValueType) {
      return false
    }
    let matchesValueTypePattern: boolean = minimatch(
      props.memberValueType,
      props.customGroup.valueTypePattern,
      {
        nocomment: true,
      },
    )
    if (!matchesValueTypePattern) {
      return false
    }
  }

  return true
}
