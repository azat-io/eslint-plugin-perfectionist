import type { CommonOptions, GroupsOptions } from '../types/common-options'
import type { NodeValueGetterFunction } from './compare'
import type { SortingNode } from '../types/sorting-node'

import { getGroupIndex } from './get-group-index'
import { sortNodes } from './sort-nodes'

/**
 * Base options for group-based sorting operations. Extends common sorting
 * options with group-specific settings.
 */
export type BaseSortNodesByGroupsOptions = {
  /**
   * Maximum line length for sorting by line-length. Lines exceeding this length
   * are sorted differently.
   */
  maxLineLength?: number
} & CommonOptions

/**
 * Parameters for sorting nodes by groups.
 *
 * @template Options - Sorting options type extending base options.
 * @template T - Type of sorting node.
 */
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

/**
 * Sorts nodes by distributing them into groups and sorting each group
 * independently.
 *
 * This is the core sorting function used by all Perfectionist rules. It
 * implements a two-phase sorting strategy:
 *
 * 1. Distribute nodes into their respective groups based on group configuration
 * 2. Sort each group independently using group-specific options.
 *
 * Ignored nodes (ESLint-disabled or manually ignored) maintain their original
 * positions to preserve intentional code organization.
 *
 * @example
 *   // React component with grouped imports
 *   const nodes = [
 *     { name: './Button', group: 'internal' },
 *     { name: 'react', group: 'external' },
 *     { name: '@mui/material', group: 'external' },
 *     { name: './utils', group: 'internal' },
 *   ]
 *
 *   sortNodesByGroups({
 *     groups: ['external', 'internal'],
 *     nodes,
 *     getOptionsByGroupIndex: index => ({
 *       options: { type: 'alphabetical', order: 'asc' },
 *     }),
 *   })
 *   // Returns: ['@mui/material', 'react', './Button', './utils']
 *   // External group sorted first, then internal group
 *
 * @example
 *   // Class members with different sorting for each group
 *   class UserService {
 *   // Static members group - sorted alphabetically
 *   static VERSION = '1.0.0';
 *   static API_URL = 'https://api.example.com';
 *
 *   // Properties group - sorted by line length
 *   id: string;
 *   cache: Map<string, User>;
 *
 *   // Methods group - sorted naturally
 *   async getUser() { ... }
 *   async updateUser() { ... }
 *   }
 *
 * @example
 *   // Object with ignored properties
 *   const config = {
 *     apiUrl: 'https://api.example.com',
 *     timeout: 5000,
 *     // eslint-disable-next-line
 *     DEBUG_MODE: true, // This stays in place due to ESLint disable
 *     retries: 3,
 *   }
 *   // DEBUG_MODE maintains its position despite sorting
 *
 * @template T - Type of sorting node.
 * @template Options - Type of sorting options.
 * @param params - Parameters for group-based sorting.
 * @returns Array of nodes sorted within their groups.
 */
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

  /* Add ignored nodes at the same position as they were before linting. */
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
