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
): boolean => {
  if (b.dependencies?.includes(a.name)) {
    return false
  } else if (a.dependencies?.includes(b.name)) {
    return true
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

  return orderCoefficient * sortingFunction(a, b) > 0
}
