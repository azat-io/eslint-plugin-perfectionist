import naturalCompare from 'natural-compare-lite'

import type { SortingNode, SortOrder } from '~/typings'
import { SortType } from '~/typings'

export let compare = (
  a: SortingNode,
  b: SortingNode,
  options: {
    order: SortOrder
    type: SortType
  },
): boolean => {
  let orderCoefficient = options.order === 'asc' ? 1 : -1
  let sortingFunction: (a: SortingNode, b: SortingNode) => number

  if (options.type === SortType.alphabetical) {
    sortingFunction = (aNode, bNode) => aNode.name.localeCompare(bNode.name)
  } else if (options.type === SortType.natural) {
    sortingFunction = (aNode, bNode) => naturalCompare(aNode.name, bNode.name)
  } else {
    sortingFunction = (aNode, bNode) => aNode.size - bNode.size
  }

  return orderCoefficient * sortingFunction(a, b) > 0
}
