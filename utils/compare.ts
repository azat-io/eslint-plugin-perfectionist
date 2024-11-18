import { compare as createNaturalCompare } from 'natural-orderby'

import type { SortingNode } from '../typings'

interface BaseCompareOptions {
  /**
   * Custom function to get the value of the node. By default, returns the
   * node's name.
   */
  nodeValueGetter?: ((node: SortingNode) => string) | null
  order: 'desc' | 'asc'
}

interface AlphabeticalCompareOptions extends BaseCompareOptions {
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  type: 'alphabetical'
  ignoreCase: boolean
}

interface LineLengthCompareOptions extends BaseCompareOptions {
  maxLineLength?: number
  type: 'line-length'
}

interface NaturalCompareOptions extends BaseCompareOptions {
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  ignoreCase: boolean
  type: 'natural'
}

export type CompareOptions =
  | AlphabeticalCompareOptions
  | LineLengthCompareOptions
  | NaturalCompareOptions

export let compare = (
  a: SortingNode,
  b: SortingNode,
  options: CompareOptions,
): number => {
  let orderCoefficient = options.order === 'asc' ? 1 : -1
  let sortingFunction: (a: SortingNode, b: SortingNode) => number
  let nodeValueGetter =
    options.nodeValueGetter ?? ((node: SortingNode) => node.name)
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
      order: options.order,
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
        let isTooLong = (
          size: number,
          node: SortingNode,
        ): undefined | boolean =>
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
        // eslint-disable-next-line regexp/no-obscure-range
        valueToCompare = valueToCompare.replaceAll(/[^a-zà-öø-ÿ]+/giu, '')
        break
      case 'trim':
        // eslint-disable-next-line regexp/no-obscure-range
        valueToCompare = valueToCompare.replaceAll(/^[^a-zà-öø-ÿ]+/giu, '')
        break
    }
    return valueToCompare.replaceAll(/\s/gu, '')
  }
