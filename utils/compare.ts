import naturalCompare from 'natural-compare-lite'

import type { SortingNode } from '../typings'

type SortType = 'alphabetical' | 'line-length' | 'natural'
type SortOrder = 'desc' | 'asc'

export let compare = (
  a: SortingNode,
  b: SortingNode,
  options: {
    'max-line-length'?: number
    'ignore-case'?: boolean
    order: SortOrder
    type: SortType
  },
): number => {
  if (b.dependencies?.includes(a.name)) {
    return -1
  } else if (a.dependencies?.includes(b.name)) {
    return 1
  }

  let orderCoefficient = options.order === 'asc' ? 1 : -1
  let sortingFunction: (a: SortingNode, b: SortingNode) => number

  let formatString = (string: string) =>
    options['ignore-case'] ? string.toLowerCase() : string

  if (options.type === 'alphabetical') {
    sortingFunction = (aNode, bNode) =>
      formatString(aNode.name).localeCompare(formatString(bNode.name))
  } else if (options.type === 'natural') {
    sortingFunction = (aNode, bNode) =>
      naturalCompare(formatString(aNode.name), formatString(bNode.name))
  } else {
    sortingFunction = (aNode, bNode) => {
      let aSize = aNode.size
      let bSize = bNode.size

      let maxLineLength = options['max-line-length']

      if (maxLineLength) {
        let isTooLong = (size: number, node: SortingNode) =>
          size > maxLineLength! && node.hasMultipleImportDeclarations

        if (isTooLong(aSize, aNode)) {
          aSize = aNode.name.length + 10
        }

        if (isTooLong(bSize, bNode)) {
          bSize = bNode.name.length + 10
        }
      }

      return aSize - bSize
    }
  }

  return orderCoefficient * sortingFunction(a, b)
}
