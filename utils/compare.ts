import naturalCompare from 'natural-compare-lite'

import type { SortingNode } from '../typings'

interface BaseCompareOptions {
  /**
   * Custom function to get the value of the node. By default, returns the node's name.
   */
  nodeValueGetter?: (node: SortingNode) => string
  order: 'desc' | 'asc'
}

interface AlphabeticalCompareOptions extends BaseCompareOptions {
  type: 'alphabetical'
  ignoreCase?: boolean
}

interface LineLengthCompareOptions extends BaseCompareOptions {
  maxLineLength?: number
  ignoreCase?: boolean
  type: 'line-length'
}

interface NaturalCompareOptions extends BaseCompareOptions {
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
  if (b.dependencies?.includes(a.name)) {
    return -1
  } else if (a.dependencies?.includes(b.name)) {
    return 1
  }

  let orderCoefficient = options.order === 'asc' ? 1 : -1
  let sortingFunction: (a: SortingNode, b: SortingNode) => number

  let formatString =
    options.type === 'natural' || !options.ignoreCase
      ? (string: string) => string
      : (string: string) => string.toLowerCase()

  let nodeValueGetter =
    options.nodeValueGetter ?? ((node: SortingNode) => node.name)

  if (options.type === 'alphabetical') {
    sortingFunction = (aNode, bNode) =>
      formatString(nodeValueGetter(aNode)).localeCompare(
        formatString(nodeValueGetter(bNode)),
      )
  } else if (options.type === 'natural') {
    let prepareNumeric = (string: string) => {
      let formattedNumberPattern = /^[+-]?[\d ,_]+(\.[\d ,_]+)?$/
      if (formattedNumberPattern.test(string)) {
        return string.replaceAll(/[ ,_]/g, '')
      }
      return string
    }
    sortingFunction = (aNode, bNode) =>
      naturalCompare(
        prepareNumeric(formatString(nodeValueGetter(aNode))),
        prepareNumeric(formatString(nodeValueGetter(bNode))),
      )
  } else {
    sortingFunction = (aNode, bNode) => {
      let aSize = aNode.size
      let bSize = bNode.size

      let { maxLineLength } = options

      if (maxLineLength) {
        let isTooLong = (size: number, node: SortingNode) =>
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
