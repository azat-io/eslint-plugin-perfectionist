import naturalCompare from 'natural-compare-lite'

import type { SortingNode, SortOrder } from '../typings'

import { SortType } from '../typings'

export let compare = (
  a: SortingNode,
  b: SortingNode,
  options: {
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

  if (options.type === SortType.alphabetical) {
    sortingFunction = (aNode, bNode) =>
      formatString(aNode.name).localeCompare(formatString(bNode.name))
  } else if (options.type === SortType.natural) {
    sortingFunction = (aNode, bNode) =>
      naturalCompare(formatString(aNode.name), formatString(bNode.name))
  } else {
    sortingFunction = (aNode, bNode) => aNode.size - bNode.size
  }

  return orderCoefficient * sortingFunction(a, b)
}
