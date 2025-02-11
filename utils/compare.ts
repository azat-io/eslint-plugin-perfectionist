import { compare as createNaturalCompare } from 'natural-orderby'

import type {
  SpecialCharactersOption,
  FallbackSortOption,
  OrderOption,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { convertBooleanToSign } from './convert-boolean-to-sign'

export type CompareOptions<T extends SortingNode> =
  | AlphabeticalCompareOptions<T>
  | LineLengthCompareOptions<T>
  | UnsortedCompareOptions<T>
  | NaturalCompareOptions<T>
  | CustomCompareOptions<T>

interface BaseCompareOptions<T extends SortingNode> {
  /**
   * Custom function to get the value of the node. By default, returns the
   * node's name.
   */
  nodeValueGetter?: ((node: T) => string) | null
  fallbackSort: FallbackSortOption
  order: OrderOption
}

interface AlphabeticalCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  type: 'alphabetical'
  ignoreCase: boolean
}

interface NaturalCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  ignoreCase: boolean
  type: 'natural'
}

interface CustomCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: SpecialCharactersOption
  ignoreCase: boolean
  alphabet: string
  type: 'custom'
}

interface LineLengthCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  maxLineLength?: number
  type: 'line-length'
}

interface UnsortedCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  type: 'unsorted'
}

type SortingFunction<T extends SortingNode> = (a: T, b: T) => number

type IndexByCharacters = Map<string, number>
let alphabetCache = new Map<string, IndexByCharacters>()

export let compare = <T extends SortingNode>(
  a: T,
  b: T,
  options: CompareOptions<T>,
): number => {
  let sortingFunction: SortingFunction<T>
  let nodeValueGetter = options.nodeValueGetter ?? ((node: T) => node.name)

  switch (options.type) {
    case 'alphabetical':
      sortingFunction = getAlphabeticalSortingFunction(options, nodeValueGetter)
      break
    case 'line-length':
      sortingFunction = getLineLengthSortingFunction(options, nodeValueGetter)
      break
    case 'unsorted':
      return 0
    case 'natural':
      sortingFunction = getNaturalSortingFunction(options, nodeValueGetter)
      break
    case 'custom':
      sortingFunction = getCustomSortingFunction(options, nodeValueGetter)
      break
  }

  let compareValue =
    convertBooleanToSign(options.order === 'asc') * sortingFunction(a, b)

  if (compareValue) {
    return compareValue
  }

  let { fallbackSort, order } = options
  return compare(a, b, {
    ...options,
    order: fallbackSort.order ?? order,
    type: fallbackSort.type,
    fallbackSort,
  } as CompareOptions<T>)
}

let getAlphabeticalSortingFunction = <T extends SortingNode>(
  { specialCharacters, ignoreCase, locales }: AlphabeticalCompareOptions<T>,
  nodeValueGetter: (node: T) => string,
): SortingFunction<T> => {
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  return (aNode: T, bNode: T) =>
    formatString(nodeValueGetter(aNode)).localeCompare(
      formatString(nodeValueGetter(bNode)),
      locales,
    )
}

let getNaturalSortingFunction = <T extends SortingNode>(
  { specialCharacters, ignoreCase, locales }: NaturalCompareOptions<T>,
  nodeValueGetter: (node: T) => string,
): SortingFunction<T> => {
  let naturalCompare = createNaturalCompare({
    locale: locales.toString(),
  })
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  return (aNode: T, bNode: T) =>
    naturalCompare(
      formatString(nodeValueGetter(aNode)),
      formatString(nodeValueGetter(bNode)),
    )
}

let getCustomSortingFunction = <T extends SortingNode>(
  { specialCharacters, ignoreCase, alphabet }: CustomCompareOptions<T>,
  nodeValueGetter: (node: T) => string,
): SortingFunction<T> => {
  let formatString = getFormatStringFunction(ignoreCase, specialCharacters)
  let indexByCharacters = alphabetCache.get(alphabet)
  if (!indexByCharacters) {
    indexByCharacters = new Map()
    for (let [index, character] of [...alphabet].entries()) {
      indexByCharacters.set(character, index)
    }
    alphabetCache.set(alphabet, indexByCharacters)
  }
  return (aNode: T, bNode: T) => {
    let aValue = formatString(nodeValueGetter(aNode))
    let bValue = formatString(nodeValueGetter(bNode))
    let minLength = Math.min(aValue.length, bValue.length)
    // Iterate character by character.
    for (let i = 0; i < minLength; i++) {
      let aCharacter = aValue[i]!
      let bCharacter = bValue[i]!
      let indexOfA = indexByCharacters.get(aCharacter)
      let indexOfB = indexByCharacters.get(bCharacter)
      indexOfA ??= Infinity
      indexOfB ??= Infinity
      if (indexOfA !== indexOfB) {
        return convertBooleanToSign(indexOfA - indexOfB > 0)
      }
    }
    if (aValue.length === bValue.length) {
      return 0
    }
    return convertBooleanToSign(aValue.length - bValue.length > 0)
  }
}

let getLineLengthSortingFunction =
  <T extends SortingNode>(
    { maxLineLength }: LineLengthCompareOptions<T>,
    nodeValueGetter: (node: T) => string,
  ): SortingFunction<T> =>
  (aNode: T, bNode: T) => {
    let aSize = aNode.size
    let bSize = bNode.size

    if (maxLineLength) {
      let isTooLong = (size: number, node: T): undefined | boolean =>
        size > maxLineLength && node.hasMultipleImportDeclarations

      if (isTooLong(aSize, aNode)) {
        aSize = nodeValueGetter(aNode).length + 10
      }

      if (isTooLong(bSize, bNode)) {
        bSize = nodeValueGetter(bNode).length + 10
      }
    }

    return aSize - bSize
  }

let getFormatStringFunction =
  (ignoreCase: boolean, specialCharacters: SpecialCharactersOption) =>
  (value: string) => {
    let valueToCompare = value
    if (ignoreCase) {
      valueToCompare = valueToCompare.toLowerCase()
    }
    switch (specialCharacters) {
      case 'remove':
        valueToCompare = valueToCompare.replaceAll(
          /[^a-z\u{C0}-\u{24F}\u{1E00}-\u{1EFF}]+/giu,
          '',
        )
        break
      case 'trim':
        valueToCompare = valueToCompare.replaceAll(
          /^[^a-z\u{C0}-\u{24F}\u{1E00}-\u{1EFF}]+/giu,
          '',
        )
        break
    }
    return valueToCompare.replaceAll(/\s/gu, '')
  }
