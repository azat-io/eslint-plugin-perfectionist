import type { SortingNode } from '../types/sorting-node'

import { getGroupNumber } from './get-group-number'

export interface GetNewlinesBetweenOptionParameters {
  nextSortingNode: SortingNode
  sortingNode: SortingNode
  options: Options
}

interface CustomGroup {
  newlinesAbove?: 'ignore' | 'always' | 'never'
  newlinesBelow?: 'ignore' | 'always' | 'never'
  newlinesInside?: 'always' | 'never'
  groupName: string
}

interface Options {
  customGroups?: Record<string, string[] | string> | CustomGroup[]
  newlinesBetween: 'ignore' | 'always' | 'never'
  groups: (string[] | string)[]
}

/**
 * Get the `newlinesBetween` option to use between two consecutive nodes.
 * The result is based on the global `newlinesBetween` option and the custom
 * groups, which can override the global option.
 * - If the two nodes are in the same custom group, the `newlinesInside` option
 * of the group is used.
 * - If the two nodes are in different custom groups, the `newlinesAbove` option
 * of the previous group and the `newlinesBelow` option of the next group are
 * used.
 * - Groups that are part of a group array are ignored
 * - `always` has a higher priority than `never`.
 * - The fallback is the global `newlinesBetween` option.
 * @param {GetNewlinesBetweenOptionParameters} props - The function arguments
 * @param {SortingNode} props.nextSortingNode - The next node to sort
 * @param {SortingNode} props.sortingNode - The current node to sort
 * @param {Options} props.options - Newlines between related options
 * @returns {'ignore' | 'always' | 'never'} - The `newlinesBetween` option to
 * use
 */
export let getNewlinesBetweenOption = ({
  nextSortingNode,
  sortingNode,
  options,
}: GetNewlinesBetweenOptionParameters): 'ignore' | 'always' | 'never' => {
  let nodeGroupNumber = getGroupNumber(options.groups, sortingNode)
  let nextNodeGroupNumber = getGroupNumber(options.groups, nextSortingNode)
  let globalNewlinesBetweenOption = getGlobalNewlinesBetweenOption({
    newlinesBetween: options.newlinesBetween,
    nextNodeGroupNumber,
    nodeGroupNumber,
  })

  if (!options.customGroups || !Array.isArray(options.customGroups)) {
    return globalNewlinesBetweenOption
  }

  let nodeGroup = options.groups[nodeGroupNumber]
  let nextNodeGroup = options.groups[nextNodeGroupNumber]

  if (Array.isArray(nodeGroup) || Array.isArray(nextNodeGroup)) {
    return globalNewlinesBetweenOption
  }

  let nodeCustomGroup = options.customGroups.find(
    customGroup => customGroup.groupName === nodeGroup,
  )
  let nextNodeCustomGroup = options.customGroups.find(
    customGroup => customGroup.groupName === nextNodeGroup,
  )

  if (
    nodeCustomGroup &&
    nextNodeCustomGroup &&
    nodeCustomGroup.groupName === nextNodeCustomGroup.groupName
  ) {
    return nodeCustomGroup.newlinesInside ?? globalNewlinesBetweenOption
  }

  return (
    getNewlinesBetweenOptionForCustomGroups({
      previousCustomGroupOption: nodeCustomGroup?.newlinesBelow,
      nextCustomGroupOption: nextNodeCustomGroup?.newlinesAbove,
    }) ?? globalNewlinesBetweenOption
  )
}

let getGlobalNewlinesBetweenOption = ({
  nextNodeGroupNumber,
  newlinesBetween,
  nodeGroupNumber,
}: {
  newlinesBetween: 'ignore' | 'always' | 'never'
  nextNodeGroupNumber: number
  nodeGroupNumber: number
}): 'always' | 'ignore' | 'never' => {
  if (newlinesBetween === 'ignore') {
    return 'ignore'
  }
  if (newlinesBetween === 'never') {
    return 'never'
  }
  return nodeGroupNumber === nextNodeGroupNumber ? 'never' : 'always'
}

let getNewlinesBetweenOptionForCustomGroups = ({
  previousCustomGroupOption,
  nextCustomGroupOption,
}: {
  previousCustomGroupOption?: 'ignore' | 'always' | 'never'
  nextCustomGroupOption?: 'ignore' | 'always' | 'never'
}): undefined | 'ignore' | 'always' | 'never' => {
  if (!previousCustomGroupOption || previousCustomGroupOption === 'ignore') {
    return nextCustomGroupOption
  }
  if (!nextCustomGroupOption || nextCustomGroupOption === 'ignore') {
    return previousCustomGroupOption
  }
  if (
    (nextCustomGroupOption === 'always' &&
      previousCustomGroupOption === 'never') ||
    (previousCustomGroupOption === 'always' &&
      nextCustomGroupOption === 'never')
  ) {
    return 'ignore'
  }
  return nextCustomGroupOption
}
