import type { CompareOptions } from './compare'
import type { SortingNode } from '../typings'

import { getGroupNumber } from './get-group-number'
import { sortNodes } from './sort-nodes'

interface GroupOptions {
  groups: (string[] | string)[]
}

interface ExtraOptions<T extends SortingNode> {
  /**
   * If not provided, `options` will be used. If function returns null, nodes
   * will not be sorted within the group.
   */
  getGroupCompareOptions?: (groupNumber: number) => CompareOptions | null
  isNodeIgnored?: (node: T) => boolean
  ignoreEslintDisabledNodes?: boolean
}

export let sortNodesByGroups = <T extends SortingNode>(
  nodes: T[],
  options: CompareOptions & GroupOptions,
  extraOptions?: ExtraOptions<T>,
): T[] => {
  let nodesByNonIgnoredGroupNumber: {
    [key: number]: T[]
  } = {}
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled &&
        extraOptions?.ignoreEslintDisabledNodes) ||
      extraOptions?.isNodeIgnored?.(sortingNode)
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupNum = getGroupNumber(options.groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNum] =
      nodesByNonIgnoredGroupNumber[groupNum] ?? []
    nodesByNonIgnoredGroupNumber[groupNum].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let compareOptions = extraOptions?.getGroupCompareOptions
      ? extraOptions.getGroupCompareOptions(Number(groupNumber))
      : options
    if (!compareOptions) {
      sortedNodes.push(...nodesByNonIgnoredGroupNumber[Number(groupNumber)])
      continue
    }
    sortedNodes.push(
      ...sortNodes(
        nodesByNonIgnoredGroupNumber[Number(groupNumber)],
        compareOptions,
      ),
    )
  }

  // Add ignored nodes at the same position as they were before linting
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }

  return sortedNodes
}
