import { compare as createNaturalCompare } from 'natural-orderby'

import type { SortingNode } from '../typings'

export type CompareOptions<T extends SortingNode> =
  | AlphabeticalCompareOptions<T>
  | LineLengthCompareOptions<T>
  | NaturalCompareOptions<T>

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

interface LineLengthCompareOptions<T extends SortingNode>
  extends BaseCompareOptions<T> {
  maxLineLength?: number
  type: 'line-length'
}

export let compare = <T extends SortingNode>(
  a: T,
  b: T,
  options: CompareOptions<T>,
): number => {
  let orderCoefficient = options.order === 'asc' ? 1 : -1
  let sortingFunction: (a: T, b: T) => number
  let nodeValueGetter = options.nodeValueGetter ?? ((node: T) => node.name)
  if (options.type === 'alphabetical') {
    let formatString = getFormatStringFunction(
      options.ignoreCase,
      options.specialCharacters,
    )
    sortingFunction = (aNode, bNode) =>
      formatString(nodeValueGetter(aNode)).localeCompare(
        formatString(nodeValueGetter(bNode)),
        options.locales,
      )
  } else if (options.type === 'natural') {
    let naturalCompare = createNaturalCompare({
      locale: options.locales.toString(),
    })
    let formatString = getFormatStringFunction(
      options.ignoreCase,
      options.specialCharacters,
    )
    sortingFunction = (aNode, bNode) =>
      naturalCompare(
        formatString(nodeValueGetter(aNode)),
        formatString(nodeValueGetter(bNode)),
      )
  } else {
    sortingFunction = (aNode, bNode) => {
      let aSize = aNode.size
      let bSize = bNode.size

      let { maxLineLength } = options

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
  }

  return orderCoefficient * sortingFunction(a, b)
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
