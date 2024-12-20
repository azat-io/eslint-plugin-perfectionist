import { compare as createNaturalCompare } from 'natural-orderby'

import type { SortingNode } from '../types'

import { convertBooleanToSign } from './convert-boolean-to-sign'

export type CompareOptions<T extends SortingNode> =
  | AlphabeticalCompareOptions<T>
  | LineLengthCompareOptions<T>
  | NaturalCompareOptions<T>
  | CustomCompareOptions<T>

interface BaseCompareOptions<T extends SortingNode> {
  /**
   * Custom function to get the value of the node. By default, returns the
   * node's name.
   */
  nodeValueGetter?: ((node: T) => string) | null
  order: 'desc' | 'asc'
}

interface AlphabeticalCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  type: 'alphabetical'
  ignoreCase: boolean
}

interface NaturalCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  ignoreCase: boolean
  type: 'natural'
}

interface CustomCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  specialCharacters: 'remove' | 'trim' | 'keep'
  ignoreCase: boolean
  alphabet: string
  type: 'custom'
}

interface LineLengthCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  maxLineLength?: number
  type: 'line-length'
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
    case 'natural':
      sortingFunction = getNaturalSortingFunction(options, nodeValueGetter)
      break
    case 'custom':
      sortingFunction = getCustomSortingFunction(options, nodeValueGetter)
      break
    case 'line-length':
      sortingFunction = getLineLengthSortingFunction(options, nodeValueGetter)
  }

  return convertBooleanToSign(options.order === 'asc') * sortingFunction(a, b)
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
    // Iterate character by character
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < aValue.length; i++) {
      let aCharacter = aValue[i]
      let bCharacter = bValue[i]
      let indexOfA = indexByCharacters.get(aCharacter)
      let indexOfB = indexByCharacters.get(bCharacter)
      indexOfA ??= Infinity
      indexOfB ??= Infinity
      if (indexOfA !== indexOfB) {
        return convertBooleanToSign(indexOfA - indexOfB > 0)
      }
    }
    return 0
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
  (ignoreCase: boolean, specialCharacters: 'remove' | 'trim' | 'keep') =>
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
