import type { CompareOptions } from './compare'
import type { SortingNode } from '../typings'

import { getGroupNumber } from './get-group-number'
import { sortNodes } from './sort-nodes'

interface GroupOptions {
  groups: (string[] | string)[]
}

export let sortNodesByGroups = <T extends SortingNode>(
  nodes: T[],
  options: CompareOptions & GroupOptions,
): T[] => {
  let nodesByGroupNumber: {
    [key: number]: T[]
  } = {}
  for (let sortingNode of nodes.values()) {
    let groupNum = getGroupNumber(options.groups, sortingNode)
    nodesByGroupNumber[groupNum] = nodesByGroupNumber[groupNum] ?? []
    nodesByGroupNumber[groupNum].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    sortedNodes.push(
      ...sortNodes(nodesByGroupNumber[Number(groupNumber)], options),
    )
  }

  return sortedNodes
}
