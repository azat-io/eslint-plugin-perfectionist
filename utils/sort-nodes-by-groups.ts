import type { GroupsOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { CompareOptions } from './compare'

import { getGroupNumber } from './get-group-number'
import { sortNodes } from './sort-nodes'

interface ExtraOptions<T extends SortingNode, Options extends BaseOptions<T>> {
  getGroupCompareOptions?(groupNumber: number): CompareOptions<T> & Options

  isNodeIgnoredForGroup?(node: T, compareOptions: Options): boolean

  ignoreEslintDisabledNodes: boolean

  isNodeIgnored?(node: T): boolean
}

type BaseOptions<T extends SortingNode> = CompareOptions<T> & GroupsOption

interface GroupsOption {
  groups: GroupsOptions<string>
}

export let sortNodesByGroups = <
  T extends SortingNode,
  Options extends BaseOptions<T>,
>(
  nodes: T[],
  options: Options,
  extraOptions?: ExtraOptions<T, Options>,
): T[] => {
  let nodesByNonIgnoredGroupNumber: Record<number, T[]> = {}
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
    let groupNumber = getGroupNumber(options.groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNumber] ??= []
    nodesByNonIgnoredGroupNumber[groupNumber].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let compareOptions =
      extraOptions?.getGroupCompareOptions?.(Number(groupNumber)) ?? options
    let nodesToPush = nodesByNonIgnoredGroupNumber[Number(groupNumber)]!

    let groupIgnoredNodes = new Set(
      nodesToPush.filter(node =>
        extraOptions?.isNodeIgnoredForGroup?.(node, compareOptions),
      ),
    )

    sortedNodes.push(
      ...sortNodes(nodesToPush, compareOptions, {
        isNodeIgnored: node => groupIgnoredNodes.has(node),
        ignoreEslintDisabledNodes: false,
      }),
    )
  }

  // Add ignored nodes at the same position as they were before linting.
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
