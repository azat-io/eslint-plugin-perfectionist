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
  let nodesByNonIgnoredGroupNumber: {
    [key: number]: T[]
  } = {}
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    let groupNum = getGroupNumber(options.groups, sortingNode)
    if (groupNum === options.groups.length) {
      ignoredNodeIndices.push(index)
      continue
    }
    nodesByNonIgnoredGroupNumber[groupNum] =
      nodesByNonIgnoredGroupNumber[groupNum] ?? []
    nodesByNonIgnoredGroupNumber[groupNum].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    sortedNodes.push(
      ...sortNodes(nodesByNonIgnoredGroupNumber[Number(groupNumber)], options),
    )
  }

  // Add ignored nodes at the same position as they were before linting
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }
  return sortedNodes
}
