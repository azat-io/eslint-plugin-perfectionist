import type { CommonOptions, GroupsOptions } from '../types/common-options'
import type { NodeValueGetterFunction } from './compare'
import type { SortingNode } from '../types/sorting-node'

import { getGroupIndex } from './get-group-index'
import { sortNodes } from './sort-nodes'

export type BaseSortNodesByGroupsOptions = {
  maxLineLength?: number
} & CommonOptions

interface SortNodesByGroupsParameters<
  Options extends BaseSortNodesByGroupsOptions,
  T extends SortingNode,
> {
  getOptionsByGroupIndex(groupIndex: number): {
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

export function sortNodesByGroups<
  T extends SortingNode,
  Options extends BaseSortNodesByGroupsOptions,
>({
  ignoreEslintDisabledNodes,
  getOptionsByGroupIndex,
  isNodeIgnoredForGroup,
  isNodeIgnored,
  groups,
  nodes,
}: SortNodesByGroupsParameters<Options, T>): T[] {
  let nodesByNonIgnoredGroupIndex: Record<number, T[]> = {}
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled && ignoreEslintDisabledNodes) ||
      isNodeIgnored?.(sortingNode)
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupIndex = getGroupIndex(groups, sortingNode)
    nodesByNonIgnoredGroupIndex[groupIndex] ??= []
    nodesByNonIgnoredGroupIndex[groupIndex].push(sortingNode)
  }

  let sortedNodes: T[] = []
  for (let groupIndex of Object.keys(nodesByNonIgnoredGroupIndex).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let { fallbackSortNodeValueGetter, nodeValueGetter, options } =
      getOptionsByGroupIndex(Number(groupIndex))
    let nodesToPush = nodesByNonIgnoredGroupIndex[Number(groupIndex)]!

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
