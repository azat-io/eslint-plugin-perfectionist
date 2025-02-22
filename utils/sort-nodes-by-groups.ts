import type { CommonOptions, GroupsOptions } from '../types/common-options'
import type { NodeValueGetterFunction } from './compare'
import type { SortingNode } from '../types/sorting-node'

import { getGroupNumber } from './get-group-number'
import { sortNodes } from './sort-nodes'

export type BaseSortNodesByGroupsOptions = {
  maxLineLength?: number
} & CommonOptions

interface SortNodesByGroupsParameters<
  Options extends BaseSortNodesByGroupsOptions,
  T extends SortingNode,
> {
  getOptionsByGroupNumber(groupNumber: number): {
    fallbackSortNodeValueGetter?: NodeValueGetterFunction<T> | null
    nodeValueGetter?: NodeValueGetterFunction<T> | null
    options: Options
  }
  isNodeIgnoredForGroup?(node: T, groupOptions: Options): boolean
  ignoreEslintDisabledNodes: boolean
  isNodeIgnored?(node: T): boolean
  groups: GroupsOptions<string>
  nodes: T[]
}

export let sortNodesByGroups = <
  T extends SortingNode,
  Options extends BaseSortNodesByGroupsOptions,
>({
  ignoreEslintDisabledNodes,
  getOptionsByGroupNumber,
  isNodeIgnoredForGroup,
  isNodeIgnored,
  groups,
  nodes,
}: SortNodesByGroupsParameters<Options, T>): T[] => {
  let nodesByNonIgnoredGroupNumber: Record<number, T[]> = {}
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled && ignoreEslintDisabledNodes) ||
      isNodeIgnored?.(sortingNode)
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupNumber = getGroupNumber(groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNumber] ??= []
    nodesByNonIgnoredGroupNumber[groupNumber].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let { fallbackSortNodeValueGetter, nodeValueGetter, options } =
      getOptionsByGroupNumber(Number(groupNumber))
    let nodesToPush = nodesByNonIgnoredGroupNumber[Number(groupNumber)]!

    let groupIgnoredNodes = new Set(
      nodesToPush.filter(node => isNodeIgnoredForGroup?.(node, options)),
    )

    sortedNodes.push(
      ...sortNodes({
        isNodeIgnored: node => groupIgnoredNodes.has(node),
        ignoreEslintDisabledNodes: false,
        fallbackSortNodeValueGetter,
        nodes: nodesToPush,
        nodeValueGetter,
        options,
      }),
    )
  }

  // Add ignored nodes at the same position as they were before linting.
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
