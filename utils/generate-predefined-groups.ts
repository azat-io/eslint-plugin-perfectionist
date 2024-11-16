import { getArrayCombinations } from './get-array-combinations'

interface Props {
  cache: Map<string, string[]>
  modifiers: string[]
  selectors: string[]
}

/**
 * Generates an ordered list of groups associated to modifiers and selectors entered
 * The groups are generated by combining all possible combinations of modifiers with one selector in the end
 * Selectors are prioritized over modifiers quantity. This means that
 * `protected abstract override get fields();` should prioritize the 'get-method' group over the 'protected-abstract-override-method' group.
 * @param selectors - List of selectors, i.e ['get-method', 'method', 'property']
 * @param modifiers - List of modifiers associated to the selector, i.e ['abstract', 'protected']
 * @param modifiers.selectors
 * @param modifiers.modifiers
 * @param modifiers.cache
 * @param cache - Stores computed groups by modifiers and selectors for performance
 */
export let generatePredefinedGroups = ({
  selectors,
  modifiers,
  cache,
}: Props): string[] => {
  let modifiersAndSelectorsKey = `${modifiers.join('&')}/${selectors.join('&')}`
  let cachedValue = cache.get(modifiersAndSelectorsKey)
  if (cachedValue) {
    return cachedValue
  }
  let allModifiersCombinations: string[][] = []
  for (let i = modifiers.length; i > 0; i--) {
    allModifiersCombinations = [
      ...allModifiersCombinations,
      ...getArrayCombinations(modifiers, i),
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
  cache.set(modifiersAndSelectorsKey, returnValue)
  return returnValue
}

/**
 * Get all permutations of an array
 * This allows 'abstract-override-protected-get-method', 'override-protected-abstract-get-method',
 * 'protected-abstract-override-get-method'... to be entered by the user and always match the same group
 * This can theoretically cause performance issues in case users enter too many modifiers at once? 8 modifiers would result
 * in 40320 permutations, 9 in 362880.
 * @param elements
 */
let getPermutations = (elements: string[]): string[][] => {
  let result: string[][] = []
  let backtrack = (first: number): void => {
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